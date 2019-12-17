defmodule Realtime.Vehicles do
  alias Realtime.{Ghost, Vehicle, VehicleOrGhost}
  alias Gtfs.{Block, Route, Trip}

  @doc """
  Also fills in ghost buses and checks for buses incoming from another route

  Vehicles are incoming from another route if they're scheduled to run within 15 minutes but are currently on another route.
  """
  @spec group_by_route([Vehicle.t()]) :: Route.by_id([VehicleOrGhost.t()])
  def group_by_route(ungrouped_vehicles) do
    now = Util.Time.now()
    in_fifteen_minutes = now + 15 * 60
    incoming_trips = Gtfs.active_trips(now, in_fifteen_minutes)
    incoming_blocks_by_route = incoming_blocks_by_route(incoming_trips)
    active_and_incoming_blocks = Gtfs.active_blocks(now, in_fifteen_minutes)

    group_by_route_with_blocks(
      ungrouped_vehicles,
      incoming_blocks_by_route,
      active_and_incoming_blocks,
      now
    )
  end

  @doc """
  Exposed for testing
  """
  @spec group_by_route_with_blocks(
          [Vehicle.t()],
          Route.by_id([Block.id()]),
          [Block.t()],
          Util.Time.timestamp()
        ) ::
          Route.by_id([VehicleOrGhost.t()])
  def group_by_route_with_blocks(
        ungrouped_vehicles,
        incoming_blocks_by_route,
        active_and_incoming_blocks,
        now
      ) do
    vehicles_by_block = Enum.group_by(ungrouped_vehicles, fn vehicle -> vehicle.block_id end)

    vehicles_by_route_id =
      ungrouped_vehicles
      |> Enum.filter(fn vehicle -> vehicle.route_id != nil end)
      |> Enum.group_by(fn vehicle -> vehicle.route_id end)

    incoming_from_another_route =
      incoming_from_another_route(incoming_blocks_by_route, vehicles_by_block)

    ghosts =
      active_and_incoming_blocks
      |> Ghost.ghosts(vehicles_by_block, now)
      |> Enum.group_by(fn ghost -> ghost.route_id end)

    vehicles_by_route_id
    |> Map.merge(incoming_from_another_route, fn _k, vehicles, incoming ->
      vehicles ++ incoming
    end)
    |> Map.merge(ghosts, fn _k, vehicles, ghosts -> vehicles ++ ghosts end)
  end

  @spec incoming_blocks_by_route([Trip.t()]) :: Route.by_id(Block.id())
  def incoming_blocks_by_route(incoming_trips) do
    incoming_trips
    |> Enum.group_by(fn trip -> trip.route_id end)
    |> Helpers.map_values(fn trips ->
      trips
      |> Enum.map(fn trip -> trip.block_id end)
      |> Enum.uniq()
    end)
  end

  @spec incoming_from_another_route(Route.by_id([Block.id()]), Route.by_id([Vehicle.t()])) ::
          Route.by_id([Vehicle.t()])
  defp incoming_from_another_route(incoming_blocks_by_route, vehicles_by_block) do
    Map.new(incoming_blocks_by_route, fn {route_id, block_ids} ->
      incoming_vehicles =
        Enum.flat_map(block_ids, fn block_id ->
          vehicles_by_block
          |> Map.get(block_id, [])
          # Only include vehicles who aren't currently on this route
          |> Enum.filter(fn vehicle -> vehicle.route_id != route_id end)
        end)

      {route_id, incoming_vehicles}
    end)
  end
end
