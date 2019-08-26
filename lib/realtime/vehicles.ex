defmodule Realtime.Vehicles do
  alias Realtime.Vehicle
  alias Gtfs.Block
  alias Gtfs.Route

  @typedoc """
  The vehicles on one route,
  And any vehicles that will be on that route soon.
  """
  @type for_route :: %{
          on_route_vehicles: [Vehicle.t()],
          incoming_vehicles: [Vehicle.t()]
        }

  @spec empty_vehicles_for_route() :: for_route()
  def empty_vehicles_for_route() do
    %{
      on_route_vehicles: [],
      incoming_vehicles: []
    }
  end

  @doc """
  Also partitions vehicles by incoming vs on_route

  Vehicles are incoming on a route if they are approaching the first stop of their trip,
  or if they are scheduled to run within 15 minutes but are currently on another route.
  """
  @spec group_by_route([Vehicle.t()]) :: Route.by_id(for_route())
  def group_by_route(ungrouped_vehicles) do
    now = Util.Time.now()
    in_fifteen_minutes = now + 15 * 60
    incoming_blocks_by_route = Gtfs.active_blocks(now, in_fifteen_minutes)
    group_by_route_with_blocks(ungrouped_vehicles, incoming_blocks_by_route)
  end

  @spec group_by_run([Vehicle.t()]) :: %{Vehicle.run_id() => [Vehicle.t()]}
  def group_by_run(ungrouped_vehicles) do
    Enum.group_by(ungrouped_vehicles, & &1.run_id)
  end

  @doc """
  Exposed for testing
  """
  @spec group_by_route_with_blocks([Vehicle.t()], Route.by_id([Block.id()])) ::
          Route.by_id(for_route())
  def group_by_route_with_blocks(ungrouped_vehicles, incoming_blocks_by_route) do
    vehicles_by_block = Enum.group_by(ungrouped_vehicles, fn vehicle -> vehicle.block_id end)

    unpartitioned_vehicles_by_route_id =
      ungrouped_vehicles
      |> Enum.filter(fn vehicle -> vehicle.route_id != nil end)
      |> Enum.group_by(fn vehicle -> vehicle.route_id end)

    partitioned_vehicles_on_their_route =
      Helpers.map_values(unpartitioned_vehicles_by_route_id, &partition_by_route_status/1)

    incoming_from_another_route =
      incoming_from_another_route(incoming_blocks_by_route, vehicles_by_block)

    merge(partitioned_vehicles_on_their_route, incoming_from_another_route)
  end

  @spec partition_by_route_status([Vehicle.t()]) :: for_route()
  defp partition_by_route_status(vehicles) do
    {on_route, incoming} =
      Enum.split_with(vehicles, fn vehicle -> vehicle.route_status == :on_route end)

    %{
      on_route_vehicles: on_route,
      incoming_vehicles: incoming
    }
  end

  @spec incoming_from_another_route(Route.by_id([Block.id()]), Route.by_id([Vehicle.t()])) ::
          Route.by_id(for_route())
  defp incoming_from_another_route(incoming_blocks_by_route, vehicles_by_block) do
    Map.new(incoming_blocks_by_route, fn {route_id, block_ids} ->
      incoming_vehicles =
        Enum.flat_map(block_ids, fn block_id ->
          vehicles_by_block
          |> Map.get(block_id, [])
          # Only include vehicles who aren't currently on this route
          |> Enum.filter(fn vehicle -> vehicle.route_id != route_id end)
        end)

      vehicles_for_route = %{
        on_route_vehicles: [],
        incoming_vehicles: incoming_vehicles
      }

      {route_id, vehicles_for_route}
    end)
  end

  @spec merge(Route.by_id(for_route()), Route.by_id(for_route())) ::
          Route.by_id(for_route())
  defp merge(vehicles_by_route_id_1, vehicles_by_route_id_2) do
    Map.merge(
      vehicles_by_route_id_1,
      vehicles_by_route_id_2,
      fn _route_id, vehicles_1, vehicles_2 ->
        %{
          on_route_vehicles: vehicles_2.on_route_vehicles ++ vehicles_1.on_route_vehicles,
          incoming_vehicles: vehicles_2.incoming_vehicles ++ vehicles_1.incoming_vehicles
        }
      end
    )
  end
end
