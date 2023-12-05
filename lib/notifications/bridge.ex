defmodule Notifications.Bridge do
  @moduledoc """
  Queries and maintains the status of a bridge
  """

  @type bridge_movement :: {:raised, integer()} | {:lowered, nil}

  use GenServer
  require Logger

  @fetch_ms 60 * 1_000

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
        {:ok, nil}
    end
  end

  def handle_info(:update, state) do
    schedule_update(self())
    new_state = fetch_status()

    if new_state do
      if state && state != new_state do
        bridge_movement_fn =
          Application.get_env(
            :notifications,
            :notifications_server_bridge_movement_fn,
            &Notifications.NotificationServer.bridge_movement/1
          )

        bridge_movement_fn.(new_state)
      end

      {:noreply, new_state}
    else
      {:noreply, state}
    end
  end

  def handle_info(msg, state) do
    Logger.warning("#{__MODULE__} unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp schedule_update(pid) do
    Process.send_after(pid, :update, @fetch_ms)
  end

  @spec fetch_status() :: bridge_movement() | nil
  defp fetch_status() do
    headers = [{"Authorization", get_auth_header()}]

    Application.get_env(:skate, :bridge_url)
    |> HTTPoison.get(headers, timeout: 2000, recv_timeout: 2000)
    |> parse_response()
  end

  @spec parse_response({:ok | :error, HTTPoison.Response.t()}) :: bridge_movement() | nil
  def parse_response({:ok, %HTTPoison.Response{status_code: status, body: body}})
      when status >= 200 and status < 300 do
    case Jason.decode(body) do
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

  def do_parse_response(response) do
    # {"bridge":{"id":1,"name":"Chelsea St Bridge","bridgeStatusId":{"id":2,"status":"Lowered"}}}
    #   or
    # {"bridge":{"id":1,"name":"Chelsea St Bridge","bridgeStatusId":{"id":2,"status":"Raised","lift_estimate":{"estimate_time":"2019-09-26 06:47:05.0"}}}}

    raw_status = get_in(response, ["bridge", "bridgeStatusId", "status"])

    lowering_time =
      response
      |> get_in(["lift_estimate", "estimate_time"])
      |> Timex.parse("{ISO:Extended}")
      |> do_get_datetime()

    Logger.info(
      "bridge_response status=#{inspect(raw_status)}, lowering_time=#{inspect(lowering_time)}"
    )

    status =
      case raw_status do
        "Lowered" -> :lowered
        "Raised" -> :raised
      end

    {status, lowering_time && DateTime.to_unix(lowering_time)}
  end

  defp do_get_datetime({:ok, estimate_time}) do
    time_zone = "America/New_York"
    Timex.to_datetime(estimate_time, time_zone)
  end

  defp do_get_datetime(_) do
    nil
  end

  defp get_auth_header() do
    username = Application.get_env(:skate, :bridge_api_username)
    password = Application.get_env(:skate, :bridge_api_password)
    auth_string = "#{username}:#{password}"
    encoded_auth_string = Base.encode64(auth_string)
    "Basic #{encoded_auth_string}"
  end
end
