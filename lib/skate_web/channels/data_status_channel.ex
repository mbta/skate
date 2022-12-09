defmodule SkateWeb.DataStatusChannel do
  use SkateWeb, :channel

  alias Realtime.DataStatusPubSub

  @impl Phoenix.Channel
  def join("data_status", _message, socket) do
    data_status = DataStatusPubSub.subscribe()
    {:ok, %{data: data_status}, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_data_status, data_status}, socket) do
    if SkateWeb.ChannelAuth.valid_token?(socket) do
      :ok = push(socket, "data_status", %{data: data_status})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end
end
