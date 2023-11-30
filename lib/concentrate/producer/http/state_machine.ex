defmodule Concentrate.Producer.HTTP.StateMachine do
  @moduledoc """
  State machine to manage the incoming/outgoing messages for making recurring HTTP requests.

  Options:
  * `fetch_after`: number of milliseconds between fetches
  * `content_warning_timeout`: number of milliseconds after which to log an error that the file is out of date
  * `fallback_url`: (optional) URL to use once the `content_warning_timeout` is hit.
  * `get_opts`: (optional) values to pass as options to HTTPoison
  """
  require Logger
  @default_timeout 15_000
  @default_fetch_after 5_000
  @default_content_warning_timeout 600_000

  defstruct url: "",
            get_opts: [
              timeout: @default_timeout,
              recv_timeout: @default_timeout,
              hackney: [pool: :http_producer_pool]
            ],
            headers: %{"accept-encoding" => "gzip"},
            params: %{},
            fetch_after: @default_fetch_after,
            content_warning_timeout: @default_content_warning_timeout,
            last_success: :never,
            previous_hash: -1,
            fallback: :undefined,
            parser: :undefined

  @type t :: %__MODULE__{url: binary}
  @type message :: {term, non_neg_integer}
  @type return :: {t, [binary], [message]}

  @spec init(binary, Keyword.t()) :: t
  def init(url, opts) when is_binary(url) and is_list(opts) do
    state = %__MODULE__{url: url, parser: Keyword.fetch!(opts, :parser)}

    state =
      struct!(
        state,
        Keyword.take(opts, ~w(get_opts fetch_after content_warning_timeout headers params)a)
      )

    state = %{state | last_success: now() - state.fetch_after - 1}

    case Keyword.get(opts, :fallback_url) do
      url when is_binary(url) ->
        %{state | fallback: {:not_active, url}}

      _ ->
        state
    end
  end

  @doc """
  Return the URL for the state machine.

  Returns the original URL, unless the fallback is active.
  """
  def url(machine)

  def url(%__MODULE__{fallback: {:active, machine}}) do
    url(machine)
  end

  def url(%__MODULE__{url: url}) do
    url
  end

  @spec fetch(t) :: return
  def fetch(%__MODULE__{} = machine) do
    message = {:fetch, machine.url}
    delay = fetch_delay(machine)

    other_messages =
      case machine.fallback do
        {:active, fallback_machine} ->
          {_, _, messages} = fetch(fallback_machine)
          wrap_fallback_messages(messages)

        _ ->
          []
      end

    {machine, [], include_fallback_messages(message, delay, other_messages)}
  end

  defp fetch_delay(machine) do
    since_last_success = now() - machine.last_success

    time =
      if since_last_success > machine.fetch_after do
        0
      else
        machine.fetch_after - since_last_success
      end

    _ =
      Logger.debug(fn ->
        "#{__MODULE__} scheduling fetch url=#{inspect(machine.url)} after=#{time}"
      end)

    time
  end

  @spec message(t, term) :: return
  def message(%__MODULE__{} = machine, message) do
    case handle_message(machine, message) do
      ret = {%__MODULE__{}, bodies, messages} when is_list(bodies) and is_list(messages) ->
        ret
    end
  end

  defp handle_message(machine, {:fetch, url}) do
    message =
      case HTTPoison.get(url, machine.headers, machine.get_opts ++ [params: machine.params]) do
        {:ok, %HTTPoison.Response{} = response} ->
          {:http_response, response}

        {:error, %HTTPoison.Error{reason: reason}} ->
          {:http_error, reason}
      end

    {machine, [], [{message, 0}]}
  end

  defp handle_message(
         machine,
         {:http_response, %{status_code: 200, headers: headers, body: body}}
       ) do
    body = decode_body(headers, body)
    {bodies, machine} = parse_bodies_if_changed(machine, body)
    machine = update_cache_headers(machine, headers)
    {machine, messages} = check_last_success(machine)
    message = {:fetch, machine.url}
    messages = include_fallback_messages(message, machine.fetch_after, messages)

    {machine, bodies, messages}
  end

  defp handle_message(machine, {:http_response, %{status_code: 301, headers: headers}}) do
    # permanent redirect: save the new URL
    {:ok, new_url} = find_header(headers, "location")
    machine = %{machine | url: new_url}
    {machine, messages} = check_last_success(machine)
    message = {:fetch, new_url}
    messages = include_fallback_messages(message, 0, messages)
    {machine, [], messages}
  end

  defp handle_message(machine, {:http_response, %{status_code: 302, headers: headers}}) do
    # temporary redirect: request the new URL but don't save it
    {:ok, new_url} = find_header(headers, "location")
    {machine, messages} = check_last_success(machine)
    message = {:fetch, new_url}
    messages = include_fallback_messages(message, 0, messages)
    {machine, [], messages}
  end

  defp handle_message(machine, {:http_response, %{status_code: 304}}) do
    # not modified
    _ =
      Logger.info(fn ->
        "#{__MODULE__}: not modified url=#{inspect(machine.url)}"
      end)

    {machine, messages} = check_last_success(machine)
    message = {:fetch, machine.url}
    messages = include_fallback_messages(message, machine.fetch_after, messages)
    {machine, [], messages}
  end

  defp handle_message(machine, {:http_response, %{status_code: code}}) do
    handle_message(machine, {:http_error, {:unexpected_code, code}})
  end

  defp handle_message(machine, {:http_error, reason}) do
    log_level = error_log_level(reason)

    _ =
      Logger.log(log_level, fn ->
        "#{__MODULE__}: url=#{inspect(machine.url)} error=#{inspect(reason)}"
      end)

    {machine, messages} = check_last_success(machine)
    message = {:fetch, machine.url}
    messages = include_fallback_messages(message, machine.fetch_after, messages)
    {machine, [], messages}
  end

  defp handle_message(%{fallback: {:active, fallback_machine}} = machine, {:fallback, message}) do
    {fallback_machine, bodies, messages} = message(fallback_machine, message)
    machine = %{machine | fallback: {:active, fallback_machine}}
    messages = wrap_fallback_messages(messages)
    {machine, bodies, messages}
  end

  defp handle_message(machine, {:fallback, _}) do
    # if we aren't in fallback mode, ignore the message
    {machine, [], []}
  end

  defp handle_message(machine, {:ssl_closed, _} = reason) do
    # log, but otherwise ignore
    log_level = error_log_level(reason)

    _ =
      Logger.log(log_level, fn ->
        "#{__MODULE__}: url=#{inspect(machine.url)} error=#{inspect(reason)}"
      end)

    {machine, [], []}
  end

  defp handle_message(machine, unknown) do
    _ =
      Logger.error(fn ->
        "#{__MODULE__}: got unexpected message url=#{inspect(machine.url)} message=#{inspect(unknown)}"
      end)

    {machine, [], []}
  end

  def decode_body(headers, body) do
    case find_header(headers, "content-encoding") do
      :error ->
        body

      {:ok, "gzip"} ->
        :zlib.gunzip(body)
    end
  end

  defp find_header(headers, match_header) do
    case Enum.find(headers, &(String.downcase(elem(&1, 0)) == match_header)) do
      {_, value} ->
        {:ok, value}

      _ ->
        :error
    end
  end

  defp update_cache_headers(machine, headers) do
    cache_headers =
      Enum.reduce(headers, machine.headers, fn {header, value}, acc ->
        case String.downcase(header) do
          "last-modified" ->
            Map.put(acc, "if-modified-since", value)

          "etag" ->
            Map.put(acc, "if-none-match", value)

          _ ->
            acc
        end
      end)

    # don't use if-none-match if we already have if-modified-since
    cache_headers =
      case cache_headers do
        %{"if-modified-since" => _, "if-none-match" => _} ->
          Map.delete(cache_headers, "if-none-match")

        _ ->
          cache_headers
      end

    %{machine | headers: cache_headers}
  end

  defp parse_bodies_if_changed(%{previous_hash: previous_hash} = machine, body) do
    case :erlang.phash2(body) do
      ^previous_hash ->
        _ =
          Logger.info(fn ->
            "#{__MODULE__}: same content url=#{inspect(machine.url)}"
          end)

        {[], machine}

      new_hash ->
        parse_body(%{machine | previous_hash: new_hash}, body)
    end
  end

  defp parse_body(machine, body) do
    {time, parsed} = :timer.tc(machine.parser, [body])

    _ =
      Logger.info(fn ->
        "#{__MODULE__} updated: url=#{inspect(url(machine))} records=#{length(parsed)} time=#{time / 1000}"
      end)

    machine =
      if parsed == [] do
        # don't log a success if there wasn't any data
        machine
      else
        deactivate_fallback(%{machine | last_success: now()})
      end

    {[parsed], machine}
  rescue
    error ->
      log_parse_error(error, machine, __STACKTRACE__)
      {[], machine}
  catch
    error ->
      log_parse_error(error, machine, __STACKTRACE__)
      {[], machine}
  end

  defp log_parse_error(error, machine, trace) do
    _ =
      Logger.error(fn ->
        "#{__MODULE__}: parse error url=#{inspect(machine.url)} error=#{inspect(error)}\n#{Exception.format_stacktrace(trace)}"
      end)

    []
  end

  defp check_last_success(machine) do
    time_since_last_success = now() - machine.last_success

    if time_since_last_success >= machine.content_warning_timeout do
      _ =
        Logger.warning(fn ->
          delay = div(time_since_last_success, 1000)
          "#{__MODULE__}: feed has not been updated url=#{inspect(machine.url)} delay=#{delay}"
        end)

      activate_fallback(%{machine | last_success: now()})
    else
      {machine, []}
    end
  end

  defp activate_fallback(%{fallback: {:not_active, url}} = machine) do
    _ =
      Logger.error(fn ->
        "#{__MODULE__} activating fallback url=#{inspect(machine.url)} fallback_url=#{inspect(url)}"
      end)

    fallback_machine =
      init(
        url,
        parser: machine.parser,
        get_opts: machine.get_opts,
        fetch_after: machine.fetch_after,
        content_warning_timeout: machine.content_warning_timeout
      )

    {fallback_machine, _bodies, messages} = fetch(fallback_machine)
    machine = %{machine | fallback: {:active, fallback_machine}}
    {machine, wrap_fallback_messages(messages)}
  end

  defp activate_fallback(machine) do
    {machine, []}
  end

  defp deactivate_fallback(%{fallback: {:active, fallback_machine}} = machine) do
    %{machine | fallback: {:not_active, fallback_machine.url}}
  end

  defp deactivate_fallback(machine) do
    machine
  end

  defp wrap_fallback_messages(messages) do
    for {message, time} <- messages do
      {{:fallback, message}, time}
    end
  end

  defp include_fallback_messages(message, delay, fallback_messages) do
    [{message, delay} | fallback_messages]
  end

  defp error_log_level(:closed), do: :warning
  defp error_log_level({:closed, _}), do: :warning
  defp error_log_level({:ssl_closed, _}), do: :warning
  defp error_log_level(:timeout), do: :warning
  defp error_log_level({:unexpected_code, _}), do: :warning
  defp error_log_level(_), do: :error

  defp now do
    System.monotonic_time(:millisecond)
  end
end
