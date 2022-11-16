defmodule Realtime.AlertsFetcher do
  use GenServer
  require Logger
  alias Schedule.Route

  @default_poll_interval_ms 3 * 60 * 1_000

  @type state :: %{
          update_fn: Route.by_id([String.t()]),
          poll_interval_ms: integer(),
          api_url: String.t(),
          api_key: String.t()
        }

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    {name, opts} = Keyword.pop(opts, :name, __MODULE__)

    GenServer.start_link(__MODULE__, opts, name: name)
  end

  @impl true
  def init(opts) do
    update_fn = Keyword.get(opts, :update_fn, &Realtime.Server.update_alerts/1)

    poll_interval_ms = Keyword.get(opts, :poll_interval_ms, @default_poll_interval_ms)

    {:ok, _} = :timer.send_interval(poll_interval_ms, self(), :query_api)

    {:ok,
     %{
       update_fn: update_fn,
       poll_interval_ms: poll_interval_ms,
       api_url: Application.get_env(:skate, :api_url),
       api_key: Application.get_env(:skate, :api_key)
     }, {:continue, :initial_poll}}
  end

  @impl true
  def handle_continue(:initial_poll, state) do
    do_poll(state)
  end

  @impl true
  def handle_info(:query_api, state) do
    do_poll(state)
  end

  @spec do_poll(state()) :: {:noreply, state()}
  defp do_poll(%{update_fn: update_fn, api_url: api_url, api_key: api_key} = state) do
    headers =
      if api_key do
        [{"x-api-key", api_key}]
      else
        []
      end

    url =
      api_url
      |> URI.merge(
        "/alerts?" <>
          URI.encode_query([{"filter[route_type]", "3,11"}, {"filter[datetime]", "NOW"}])
      )
      |> URI.to_string()

    case HTTPoison.get(url, headers) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case parse_and_update_alerts(body, update_fn) do
          :ok ->
            Logger.info("#{__MODULE__}: updated_alerts url=#{inspect(url)}")

          {:error, error} ->
            Logger.warn(
              "#{__MODULE__}: unable_to_parse_alerts url=#{inspect(url)} error=#{inspect(error)}"
            )
        end

      response ->
        Logger.warn(
          "#{__MODULE__}: unexpected_response url=#{inspect(url)} response=#{inspect(response)}"
        )
    end

    {:noreply, state}
  end

  @spec parse_and_update_alerts(binary(), (Route.by_id([String.t()]) -> term())) ::
          :ok | {:error, any()}
  defp parse_and_update_alerts(body, update_fn) do
    case JsonApi.parse(body) do
      %JsonApi{data: data} ->
        alerts =
          Enum.reduce(data, %{}, fn alert, acc ->
            is_detour? = alert.attributes["effect"] == "DETOUR"

            if is_detour? do
              route_ids =
                Enum.reduce(alert.attributes["informed_entity"], [], fn informed_entity,
                                                                        route_ids ->
                  if informed_entity["route"] && informed_entity["route"] not in route_ids do
                    [informed_entity["route"] | route_ids]
                  else
                    route_ids
                  end
                end)

              alert_text = alert.attributes["service_effect"]

              Enum.reduce(route_ids, acc, fn route_id, acc ->
                {_old_value, acc} =
                  Map.get_and_update(acc, route_id, fn alerts_for_route ->
                    case alerts_for_route do
                      nil -> {alerts_for_route, [alert_text]}
                      alerts -> {alerts_for_route, [alert_text | alerts]}
                    end
                  end)

                acc
              end)
            else
              acc
            end
          end)

        update_fn.(alerts)

        :ok

      {:error, error} ->
        {:error, error}
    end
  end
end
