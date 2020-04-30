defmodule Realtime.TrainVehiclesPubSub do
  @moduledoc """
  Saves train vehicles by route ID for sending to the client via the TrainVehiclesChannel.
  """
  use GenServer

  alias Schedule.Route
  alias Realtime.TrainVehiclesStore
  alias TrainVehicles.TrainVehicle

  @type broadcast_message :: {:new_train_vehicles, [TrainVehicle.t()]}

  # Client

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.TrainVehiclesPubSub

  @spec start_link() :: GenServer.on_start()
  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, default_name())

    GenServer.start_link(
      __MODULE__,
      opts,
      name: name
    )
  end

  @spec subscribe(Route.id()) :: [TrainVehicle.t()]
  @spec subscribe(Route.id(), GenServer.server()) :: [TrainVehicle.t()]
  def subscribe(route_id, server \\ default_name()) do
    {registry_key, train_vehicles} = GenServer.call(server, {:subscribe, route_id})
    Registry.register(Realtime.Registry, registry_key, route_id)
    train_vehicles
  end

  # Server

  @impl GenServer
  def init(opts) do
    subscribe_fn = Keyword.get(opts, :subscribe_fn, &Phoenix.PubSub.subscribe/2)
    subscribe_fn.(TrainVehicles.PubSub, "train_vehicles")

    {:ok, %TrainVehiclesStore{}}
  end

  @impl GenServer
  def handle_call(
        {:subscribe, route_id},
        _from,
        %TrainVehiclesStore{train_vehicles_by_route_id: train_vehicles_by_route_id} = state
      ) do
    registry_key = self()

    {:reply, {registry_key, train_vehicles_for_route_id(train_vehicles_by_route_id, route_id)},
     state}
  end

  @impl GenServer
  def handle_info({:reset, train_vehicles}, state) do
    new_state = TrainVehiclesStore.reset(state, train_vehicles)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  def handle_info({:add, new_train_vehicles}, state) do
    new_state = TrainVehiclesStore.add(state, new_train_vehicles)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  def handle_info({:update, updated_train_vehicles}, state) do
    new_state = TrainVehiclesStore.update(state, updated_train_vehicles)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  def handle_info(
        {:remove, ids},
        state
      ) do
    new_state = TrainVehiclesStore.remove(state, ids)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  @spec broadcast(TrainVehiclesStore.t()) :: :ok
  defp broadcast(state) do
    registry_key = self()

    Registry.dispatch(Realtime.Supervisor.registry_name(), registry_key, fn entries ->
      Enum.each(entries, &send_data(&1, state))
    end)
  end

  @spec send_data({pid, Route.id()}, TrainVehiclesStore.t()) :: broadcast_message()
  defp send_data({pid, route_id}, %TrainVehiclesStore{
         train_vehicles_by_route_id: train_vehicles_by_route_id
       }) do
    send(
      pid,
      {:new_train_vehicles, train_vehicles_for_route_id(train_vehicles_by_route_id, route_id)}
    )
  end

  @spec train_vehicles_for_route_id(TrainVehiclesStore.train_vehicles_by_route_id(), Route.id()) ::
          [
            TrainVehicle.t()
          ]
  defp train_vehicles_for_route_id(train_vehicles_by_route_id, route_id),
    do: Map.get(train_vehicles_by_route_id, route_id, [])
end
