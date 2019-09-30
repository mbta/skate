defmodule Realtime.Vehicles do
  alias Realtime.{Ghost, Vehicle}
  alias Gtfs.{Block, Route, Trip}

  @typedoc """
  The vehicles on one route,
  And any vehicles that will be on that route soon.
  """
  @type for_route :: %{
          on_route_vehicles: [Vehicle.t()],
          incoming_vehicles: [Vehicle.t()],
          ghosts: [Ghost.t()]
        }

  @spec empty_vehicles_for_route() :: for_route()
  def empty_vehicles_for_route() do
    %{
      on_route_vehicles: [],
      incoming_vehicles: [],
      ghosts: []
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
    active_trips = Gtfs.active_trips(now)
    group_by_route_with_blocks(ungrouped_vehicles, incoming_blocks_by_route, active_trips, now)
  end

  @doc """
  Exposed for testing
  """
  @spec group_by_route_with_blocks(
          [Vehicle.t()],
          Route.by_id([Block.id()]),
          [Trip.t()],
          Util.Time.timestamp()
        ) ::
          Route.by_id(for_route())
  def group_by_route_with_blocks(ungrouped_vehicles, incoming_blocks_by_route, active_trips, now) do
    vehicles_by_block = Enum.group_by(ungrouped_vehicles, fn vehicle -> vehicle.block_id end)

    unpartitioned_vehicles_by_route_id =
      ungrouped_vehicles
      |> Enum.filter(fn vehicle -> vehicle.route_id != nil end)
      |> Enum.group_by(fn vehicle -> vehicle.route_id end)

    partitioned_vehicles_on_their_route =
      Helpers.map_values(unpartitioned_vehicles_by_route_id, &partition_by_route_status/1)

    incoming_from_another_route =
      incoming_from_another_route(incoming_blocks_by_route, vehicles_by_block)

    ghosts =
      active_trips
      |> Ghost.ghosts(vehicles_by_block, now)
      |> Enum.group_by(fn ghost -> ghost.route_id end)
      |> Helpers.map_values(fn ghosts ->
        %{
          on_route_vehicles: [],
          incoming_vehicles: [],
          ghosts: ghosts
        }
      end)

    merge([
      partitioned_vehicles_on_their_route,
      incoming_from_another_route,
      ghosts
    ])
  end

  @spec partition_by_route_status([Vehicle.t()]) :: for_route()
  defp partition_by_route_status(vehicles) do
    {on_route, incoming} =
      Enum.split_with(vehicles, fn vehicle -> vehicle.route_status == :on_route end)

    %{
      on_route_vehicles: on_route,
      incoming_vehicles: incoming,
      ghosts: []
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
        incoming_vehicles: incoming_vehicles,
        ghosts: []
      }

      {route_id, vehicles_for_route}
    end)
  end

  @spec merge([Route.by_id(for_route())]) :: Route.by_id(for_route())
  defp merge(vehicles_by_route_ids) do
    vehicles_by_route_ids
    |> merge_by_route_id()
    |> Helpers.map_values(fn vehicles_for_routes ->
      %{
        on_route_vehicles: Enum.flat_map(vehicles_for_routes, & &1.on_route_vehicles),
        incoming_vehicles: Enum.flat_map(vehicles_for_routes, & &1.incoming_vehicles),
        ghosts: Enum.flat_map(vehicles_for_routes, & &1.ghosts)
      }
    end)
  end

  @spec merge_by_route_id([Route.by_id(v)]) :: Route.by_id([v]) when v: term()
  defp merge_by_route_id(by_route_ids) do
    Enum.reduce(by_route_ids, %{}, fn by_route_id, acc ->
      by_route_id
      |> Helpers.map_values(fn for_route -> [for_route] end)
      |> Map.merge(acc, fn _route_id, [new_for_route], acc_for_routes ->
        [new_for_route | acc_for_routes]
      end)
    end)
  end
end
