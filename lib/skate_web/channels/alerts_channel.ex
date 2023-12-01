defmodule SkateWeb.AlertsChannel do
  @moduledoc false

  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("alerts:route:" <> route_id, _message, socket) do
    {lookup_key, alerts} = Duration.log_duration(Server, :subscribe_to_alerts, [route_id])

    {:ok, %{data: alerts}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:new_realtime_data, ets}, socket) do
    lookup_key = Map.get(socket.assigns, :lookup_key)

    data = Server.lookup({ets, lookup_key})

    :ok = push(socket, "alerts", %{data: data})
    {:noreply, socket}
  end
end
