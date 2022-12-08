defmodule SkateWeb.AlertsChannel do
  use SkateWeb, :channel

  alias Realtime.Server
  alias Util.Duration

  @impl Phoenix.Channel
  def join("alerts:route:" <> route_id, _message, socket) do
    alerts = Duration.log_duration(Server, :subscribe_to_alerts, [route_id])
    {:ok, %{data: alerts}, socket}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, lookup_args}, socket) do
    if SkateWeb.ChannelAuth.valid_token?(socket) do
      data = Server.lookup(lookup_args)
      :ok = push(socket, "alerts", %{data: data})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end
end
