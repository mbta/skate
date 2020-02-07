defmodule Realtime.Vehicles do
  alias Realtime.{BlockWaiver, Ghost, Vehicle, VehicleOrGhost}
  alias Gtfs.{Block, Route, Trip}

  @doc """
  Also fills in ghost buses and checks for buses incoming from another route

  Vehicles are incoming from another route if they're scheduled to run within 15 minutes but are currently on another route.
  """
  @spec group_by_route([Vehicle.t()], BlockWaiver.block_waivers_by_trip()) ::
          Route.by_id([VehicleOrGhost.t()])
  def group_by_route(ungrouped_vehicles, block_waivers) do
    now = Util.Time.now()
    in_ten_minutes = now + 10 * 60
    in_fifteen_minutes = now + 15 * 60

    # We show vehicles incoming from another route if they'll start the new route within 15 minutes
    incoming_trips = Gtfs.active_trips(now, in_fifteen_minutes)
    incoming_blocks_by_route = incoming_blocks_by_route(incoming_trips)
    # We show pulling out ghosts if they'll start within 10 minutes
    active_and_incoming_blocks_by_date = Gtfs.active_blocks(now, in_ten_minutes)

    group_by_route_with_blocks(
      ungrouped_vehicles,
      block_waivers,
      incoming_blocks_by_route,
      active_and_incoming_blocks_by_date,
      now
    )
  end

  @doc """
  Exposed for testing
  """
  @spec group_by_route_with_blocks(
          [Vehicle.t()],
          BlockWaiver.block_waivers_by_trip(),
          Route.by_id([Block.id()]),
          %{Date.t() => [Block.t()]},
          Util.Time.timestamp()
        ) ::
          Route.by_id([VehicleOrGhost.t()])
  def group_by_route_with_blocks(
        ungrouped_vehicles,
        block_waivers,
        incoming_blocks_by_route,
        active_and_incoming_blocks_by_date,
        now
      ) do
    ghosts =
      Ghost.ghosts(active_and_incoming_blocks_by_date, ungrouped_vehicles, block_waivers, now)

    vehicles_and_ghosts = ghosts ++ ungrouped_vehicles

    incoming_from_another_route =
      incoming_from_another_route(incoming_blocks_by_route, vehicles_and_ghosts)

    vehicles_and_ghosts
    |> Enum.filter(fn vehicle_or_ghost -> vehicle_or_ghost.route_id != nil end)
    |> Enum.group_by(fn vehicle_or_ghost -> vehicle_or_ghost.route_id end)
    |> Map.merge(incoming_from_another_route, fn _route_id, on_route, incoming ->
      on_route ++ incoming
    end)
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

  @spec incoming_from_another_route(Route.by_id([Block.id()]), [VehicleOrGhost.t()]) ::
          Route.by_id([VehicleOrGhost.t()])
  defp incoming_from_another_route(incoming_blocks_by_route, vehicles_and_ghosts) do
    vehicles_and_ghosts_by_block =
      Enum.group_by(vehicles_and_ghosts, fn vehicle_or_ghost -> vehicle_or_ghost.block_id end)

    Map.new(incoming_blocks_by_route, fn {route_id, block_ids} ->
      incoming_vehicles_and_ghosts =
        Enum.flat_map(block_ids, fn block_id ->
          vehicles_and_ghosts_by_block
          |> Map.get(block_id, [])
          # Only include vehicles who aren't currently on this route
          |> Enum.filter(fn vehicle_or_ghost -> vehicle_or_ghost.route_id != route_id end)
        end)

      {route_id, incoming_vehicles_and_ghosts}
    end)
  end
end
