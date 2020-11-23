defmodule Realtime.TrainVehiclesStore do
  @moduledoc """
  Stores train vehicles by route ID.
  """

  alias Schedule.Route
  alias TrainVehicles.TrainVehicle

  @type t :: %__MODULE__{
          train_vehicles_by_route_id: train_vehicles_by_route_id()
        }

  @type train_vehicles_by_route_id :: %{Route.id() => [TrainVehicle.t()]}

  defstruct train_vehicles_by_route_id: %{}

  @spec reset(t(), [TrainVehicle.t()]) :: t()
  def reset(store, train_vehicles) do
    train_vehicles_by_route_id =
      Enum.group_by(train_vehicles, &route_id_merging_green_lines(&1.route_id))

    Map.put(store, :train_vehicles_by_route_id, train_vehicles_by_route_id)
  end

  @spec add(t(), [TrainVehicle.t()]) :: t()
  def add(
        %__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = store,
        new_train_vehicles
      ) do
    new_train_vehicles_by_route_id =
      Enum.reduce(
        new_train_vehicles,
        train_vehicles_by_route_id,
        fn new_train_vehicle, acc ->
          route_id = route_id_merging_green_lines(new_train_vehicle.route_id)
          vehicles = Map.get(acc, route_id, [])
          Map.put(acc, route_id, [new_train_vehicle | vehicles])
        end
      )

    Map.put(store, :train_vehicles_by_route_id, new_train_vehicles_by_route_id)
  end

  @spec update(t(), [TrainVehicle.t()]) :: t()
  def update(
        %__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = store,
        updated_train_vehicles
      ) do
    new_train_vehicles_by_route_id =
      Enum.reduce(
        updated_train_vehicles,
        train_vehicles_by_route_id,
        fn updated_train_vehicle, acc ->
          route_id = route_id_merging_green_lines(updated_train_vehicle.route_id)

          vehicles_sans_old =
            acc
            |> Map.get(route_id, [])
            |> Enum.reject(&(&1.id == updated_train_vehicle.id))

          Map.put(acc, route_id, [updated_train_vehicle | vehicles_sans_old])
        end
      )

    Map.put(store, :train_vehicles_by_route_id, new_train_vehicles_by_route_id)
  end

  @spec remove(t(), [TrainVehicle.id()]) :: t()
  def remove(%__MODULE__{train_vehicles_by_route_id: train_vehicles_by_route_id} = store, ids) do
    new_train_vehicles_by_route_id =
      Map.new(
        train_vehicles_by_route_id,
        fn {route_id, train_vehicles} ->
          {route_id,
           Enum.reject(train_vehicles, fn %TrainVehicle{id: id} -> Enum.member?(ids, id) end)}
        end
      )

    Map.put(store, :train_vehicles_by_route_id, new_train_vehicles_by_route_id)
  end

  @spec route_id_merging_green_lines(String.t()) :: String.t()
  defp route_id_merging_green_lines("Green-B"), do: "Green"
  defp route_id_merging_green_lines("Green-C"), do: "Green"
  defp route_id_merging_green_lines("Green-D"), do: "Green"
  defp route_id_merging_green_lines("Green-E"), do: "Green"
  defp route_id_merging_green_lines(route_id), do: route_id
end
