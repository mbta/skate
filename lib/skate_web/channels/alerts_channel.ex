defmodule SkateWeb.AlertsChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("alerts:route:" <> route_id, _message, socket) do
    alerts = Duration.log_duration(Server, :subscribe_to_alerts, [route_id])
    {:ok, %{data: alerts}, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:new_realtime_data, lookup_args}, socket) do
    data = Server.lookup(lookup_args)
    :ok = push(socket, "alerts", %{data: data})
    {:noreply, socket}
  end
end
