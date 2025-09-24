defmodule Notifications.Bridge do
  @moduledoc """
  Queries and maintains the status of a bridge
  """

  @type bridge_movement :: {:raised, integer()} | {:lowered, nil}
  @type token :: %{expiration: DateTime.t() | nil, value: String.t() | nil}
  @type state :: %{token: token(), status: bridge_movement() | nil}
  @type bridge_response :: %{
          liftInProgress: boolean(),
          estimatedDurationInMinutes: integer()
        }

  use GenServer
  require Logger

  @fetch_ms 60 * 1_000
  @status_endpoint "BridgeRealTime"
  @token_endpoint "token"

  @spec default_name() :: GenServer.name()
  def default_name(), do: Notifications.Bridge

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, default_name())

    GenServer.start_link(
      __MODULE__,
      opts,
      name: name
    )
  end

  @spec update(GenServer.server()) :: any()
  def update(pid \\ __MODULE__) do
    Kernel.send(pid, :update)
  end

  @spec init(Keyword.t()) :: {:ok, any()}
  def init(_opts) do
    case Application.get_env(:skate, :bridge_url) do
      nil ->
        Logger.warning("not starting Bridge: no url configured")
        :ignore

      _ ->
        schedule_update(self())
        {:ok, %{token: %{value: nil, expiration: nil}, status: nil}}
    end
  end

  def handle_info(:update, state) do
    schedule_update(self())
    new_state = fetch_state(state)

    previous_status = state.status
    new_status = new_state.status

    if new_status do
      # To retain existing behavior, only compare the lift status and
      # exclude the estimated duration-derived time since it changes
      if previous_status && elem(previous_status, 0) != elem(new_status, 0) do
        bridge_movement_fn =
          Application.get_env(
            :notifications,
            :notifications_server_bridge_movement_fn,
            &Skate.BridgeStatus.maybe_record_bridge_status/1
          )

        {status, lowering_time} = new_status

        bridge_movement_fn.(%{
          status: status,
          lowering_time: lowering_time
        })
      end
    end

    {:noreply, new_state}
  end

  def handle_info(msg, state) do
    Logger.warning("unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp schedule_update(pid) do
    Process.send_after(pid, :update, @fetch_ms)
  end

  @spec fetch_state(state) :: state()
  defp fetch_state(state) do
    token = fetch_token(state)
    headers = [{"Authorization", "Bearer #{token.value}"}]

    status =
      "#{Application.get_env(:skate, :bridge_url)}/#{@status_endpoint}"
      |> HTTPoison.get(headers, timeout: 2000, recv_timeout: 2000)
      |> parse_response()

    %{status: status, token: token}
  end

  defp fetch_token(state) do
    now = Timex.now()

    if state.token.expiration == nil or
         Timex.before?(state.token.expiration, now) do
      update_token(now)
    else
      state.token
    end
  end

  def update_token(now) do
    username = Application.get_env(:skate, :bridge_api_username)
    password = Application.get_env(:skate, :bridge_api_password)
    bridge_url = Application.get_env(:skate, :bridge_url)

    # Encode as application/x-www-form-urlencoded
    body =
      URI.encode_query(%{
        "grant_type" => "password",
        "username" => username,
        "password" => password
      })

    with {:ok, %{status_code: 200, body: body}} <-
           HTTPoison.post(
             "#{bridge_url}/#{@token_endpoint}",
             body,
             [{"Content-Type", "application/x-www-form-urlencoded"}]
           ),
         {:ok, data} <- Jason.decode(body) do
      # { "access_token": "token", "token_type": "bearer", "expires_in": 2591999}
      expires_in = Map.get(data, "expires_in")
      expiration = Timex.shift(now, seconds: expires_in - 60)
      %{value: Map.get(data, "access_token"), expiration: expiration}
    else
      err ->
        Logger.warning("bridge_api_failure: could not fetch new token: #{inspect(err)}")
        %{value: nil, expiration: nil}
    end
  end

  @spec parse_response({:ok | :error, HTTPoison.Response.t()}) :: bridge_movement() | nil
  def parse_response({:ok, %HTTPoison.Response{status_code: status, body: body}})
      when status >= 200 and status < 300 do
    case Jason.decode(body, keys: :atoms!) do
      {:ok, response} ->
        do_parse_response(response)

      _ ->
        Logger.warning("bridge_api_failure: could not parse json response")
        nil
    end
  end

  def parse_response({:ok, %HTTPoison.Response{status_code: status}}) do
    Logger.warning("bridge_api_failure: status code #{inspect(status)}")
    nil
  end

  def parse_response({:error, %HTTPoison.Error{reason: reason}}) do
    Logger.warning("bridge_api_failure: #{inspect(reason)}")
    nil
  end

  @spec do_parse_response(bridge_response()) :: bridge_movement() | nil
  def do_parse_response(%{
        liftInProgress: lift_in_progress,
        estimatedDurationInMinutes: estimated_duration_in_minutes
      }) do
    estimated_duration_in_minutes =
      if lift_in_progress do
        estimated_duration_in_minutes
      end

    lowering_time =
      if estimated_duration_in_minutes do
        "America/New_York"
        |> Timex.now()
        |> Timex.shift(minutes: estimated_duration_in_minutes)
      end

    Logger.info(
      "bridge_response lift_in_progress=#{inspect(lift_in_progress)} estimated_duration_in_minutes=#{inspect(estimated_duration_in_minutes)} lowering_time=#{inspect(lowering_time)}"
    )

    status =
      if lift_in_progress do
        :raised
      else
        :lowered
      end

    {status, lowering_time && DateTime.to_unix(lowering_time)}
  end

  def do_parse_response(response) do
    Logger.warning(
      "bridge_api_failure: could not parse json response in unexpected format, response=#{inspect(response)}"
    )

    nil
  end
end
