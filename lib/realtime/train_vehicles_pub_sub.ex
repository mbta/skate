defmodule Realtime.TrainVehiclesPubSub do
  @moduledoc """
  Saves train vehicles by route ID for sending to the client via the TrainVehiclesChannel.
  """
  use GenServer

  alias Gtfs.Route
  alias TrainVehicles.TrainVehicle

  @type t :: %__MODULE__{
          train_vehicles_by_route_id: train_vehicles_by_route_id()
        }

  @type train_vehicles_by_route_id :: %{Route.id() => [TrainVehicle.t()]}

  @type broadcast_message :: {:new_train_vehicles, [TrainVehicle.t()]}

  defstruct train_vehicles_by_route_id: %{}

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

    {:ok, %__MODULE__{}}
  end

  @impl GenServer
  def handle_call(
        {:subscribe, route_id},
        _from,
        %__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = state
      ) do
    registry_key = self()

    {:reply, {registry_key, train_vehicles_for_route_id(train_vehicles_by_route_id, route_id)},
     state}
  end

  @impl GenServer
  def handle_info({:reset, train_vehicles}, state) do
    train_vehicles_by_route_id =
      train_vehicles
      |> Enum.group_by(&route_id_merging_green_lines/1)

    new_state = Map.put(state, :train_vehicles_by_route_id, train_vehicles_by_route_id)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  def handle_info(
        {:add, new_train_vehicles},
        %__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = state
      ) do
    new_train_vehicles_by_route_id =
      Enum.reduce(
        new_train_vehicles,
        train_vehicles_by_route_id,
        fn new_train_vehicle, acc ->
          vehicles = Map.get(acc, new_train_vehicle.route_id, [])
          Map.put(acc, new_train_vehicle.route_id, [new_train_vehicle | vehicles])
        end
      )

    new_state = Map.put(state, :train_vehicles_by_route_id, new_train_vehicles_by_route_id)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  def handle_info(
        {:update, updated_train_vehicles},
        %__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = state
      ) do
    new_train_vehicles_by_route_id =
      Enum.reduce(
        updated_train_vehicles,
        train_vehicles_by_route_id,
        fn updated_train_vehicle, acc ->
          vehicles_sans_old =
            acc
            |> Map.get(updated_train_vehicle.route_id, [])
            |> Enum.reject(&(&1.id == updated_train_vehicle.id))

          Map.put(acc, updated_train_vehicle.route_id, [updated_train_vehicle | vehicles_sans_old])
        end
      )

    new_state = Map.put(state, :train_vehicles_by_route_id, new_train_vehicles_by_route_id)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  def handle_info(
        {:remove, ids},
        %__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = state
      ) do
    new_train_vehicles_by_route_id =
      Map.new(
        train_vehicles_by_route_id,
        fn {route_id, train_vehicles} ->
          {route_id,
           Enum.reject(train_vehicles, fn %TrainVehicle{id: id} -> Enum.member?(ids, id) end)}
        end
      )

    new_state = Map.put(state, :train_vehicles_by_route_id, new_train_vehicles_by_route_id)

    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  @spec route_id_merging_green_lines(TrainVehicle.t()) :: String.t()
  defp route_id_merging_green_lines(%TrainVehicle{route_id: "Green-B"}), do: "Green"
  defp route_id_merging_green_lines(%TrainVehicle{route_id: "Green-C"}), do: "Green"
  defp route_id_merging_green_lines(%TrainVehicle{route_id: "Green-D"}), do: "Green"
  defp route_id_merging_green_lines(%TrainVehicle{route_id: "Green-E"}), do: "Green"
  defp route_id_merging_green_lines(%TrainVehicle{route_id: route_id}), do: route_id

  @spec broadcast(t()) :: :ok
  defp broadcast(state) do
    registry_key = self()

    Registry.dispatch(Realtime.Supervisor.registry_name(), registry_key, fn entries ->
      Enum.each(entries, &send_data(&1, state))
    end)
  end

  @spec send_data({pid, Route.id()}, t) :: broadcast_message()
  defp send_data({pid, route_id}, %__MODULE__{
         train_vehicles_by_route_id: train_vehicles_by_route_id
       }) do
    send(
      pid,
      {:new_train_vehicles, train_vehicles_for_route_id(train_vehicles_by_route_id, route_id)}
    )
  end

  @spec train_vehicles_for_route_id(train_vehicles_by_route_id(), Route.id()) :: [
          TrainVehicle.t()
        ]
  defp train_vehicles_for_route_id(train_vehicles_by_route_id, route_id),
    do: Map.get(train_vehicles_by_route_id, route_id, [])
end
