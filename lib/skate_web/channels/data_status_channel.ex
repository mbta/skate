defmodule SkateWeb.DataStatusChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Realtime.DataStatusPubSub

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("data_status", _message, socket) do
    data_status = DataStatusPubSub.subscribe()
    {:ok, %{data: data_status}, socket}
  end

  def join_authenticated(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:new_data_status, data_status}, socket) do
    :ok = push(socket, "data_status", %{data: data_status})
    {:noreply, socket}
  end
end
