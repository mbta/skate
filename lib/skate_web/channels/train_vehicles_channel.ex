defmodule SkateWeb.TrainVehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.TrainVehiclesPubSub

  use SkateWeb.AuthenticatedChannel

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("train_vehicles:" <> route_id, _message, socket) do
    train_vehicles_subscribe_fn =
      Application.get_env(
        :skate_web,
        :train_vehicles_subscribe_fn,
        &TrainVehiclesPubSub.subscribe/1
      )

    train_vehicles = train_vehicles_subscribe_fn.(route_id)

    {:ok, %{data: train_vehicles}, socket}
  end

  @impl Phoenix.Channel
  def handle_info({:new_train_vehicles, train_vehicles}, socket) do
    if SkateWeb.ChannelAuth.valid_token?(socket) do
      :ok = push(socket, "train_vehicles", %{data: train_vehicles})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end
end
