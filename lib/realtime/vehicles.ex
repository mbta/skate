defmodule Realtime.Vehicles do
  alias Realtime.{Ghost, Vehicle, VehicleOrGhost}
  alias Schedule.{Block, Route, Trip}

  @doc """
  Also fills in ghost buses and checks for buses incoming from another route

  Vehicles are incoming from another route if they're scheduled to run within 15 minutes but are currently on another route.
  """
  @spec group_by_route([Vehicle.t()]) :: Route.by_id([VehicleOrGhost.t()])
  def group_by_route(ungrouped_vehicles) do
    now = Util.Time.now()
    # TODO: don't merge this, even though it would be sort of funny.
    in_fifteen_minutes = now + 150 * 60

    # We show vehicles incoming from another route if they'll start the new route within 15 minutes
    incoming_trips = Schedule.active_trips(now, in_fifteen_minutes)
    # Includes blocks that are scheduled to be pulling out
    active_blocks_by_date = Schedule.active_blocks(now, now)

    result =
      group_by_route_with_blocks(
        ungrouped_vehicles,
        incoming_trips,
        active_blocks_by_date,
        now
      )

    ## TODO: don't forget to take this bit out before you merge
    result
    |> Enum.map(fn {k, v} ->
      {k, v |> Enum.map(& &1.route_id) |> Enum.filter(&(&1 != k))}
    end)
    |> Enum.reject(fn {_k, v} -> length(v) == 0 end)
    |> IO.inspect()

    result
  end

  @doc """
  Exposed for testing
  """
  @spec group_by_route_with_blocks(
          [Vehicle.t()],
          [Trip.t()],
          %{Date.t() => [Block.t()]},
          Util.Time.timestamp()
        ) ::
          Route.by_id([VehicleOrGhost.t()])
  def group_by_route_with_blocks(
        ungrouped_vehicles,
        incoming_trips,
        active_blocks_by_date,
        now
      ) do
    ghosts = Ghost.ghosts(active_blocks_by_date, ungrouped_vehicles, now)
    vehicles_and_ghosts = ghosts ++ ungrouped_vehicles

    incoming_from_another_route =
      incoming_from_another_route(incoming_trips, vehicles_and_ghosts)
      |> Enum.map(fn {route_id, vehicles_and_ghosts} ->
        {route_id,
         sort_incoming_vehicles_and_ghosts(route_id, vehicles_and_ghosts, incoming_trips)}
      end)
      |> Map.new()

    vehicles_and_ghosts
    |> Enum.filter(fn vehicle_or_ghost -> vehicle_or_ghost.route_id != nil end)
    |> Enum.group_by(fn vehicle_or_ghost -> vehicle_or_ghost.route_id end)
    |> Map.merge(incoming_from_another_route, fn _route_id, on_route, incoming ->
      on_route ++ incoming
    end)
  end

  @spec sort_incoming_vehicles_and_ghosts(Route.id(), [Vehicle.t() | Ghost.t()], [Trip.t()]) :: [
          Vehicle.t() | Ghost.t()
        ]
  defp sort_incoming_vehicles_and_ghosts(route_id, vehicles_and_ghosts, incoming_trips) do
    vehicles_and_ghosts
    |> Enum.sort_by(fn vehicle_or_ghost ->
      incoming_trip =
        incoming_trips
        |> Enum.find(fn trip ->
          trip.block_id == vehicle_or_ghost.block_id && trip.route_id == route_id
        end)

      incoming_trip.start_time
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

  @spec incoming_from_another_route([Trip.t()], [VehicleOrGhost.t()]) ::
          Route.by_id([VehicleOrGhost.t()])
  defp incoming_from_another_route(incoming_trips, vehicles_and_ghosts) do
    vehicles_and_ghosts_by_block =
      Enum.group_by(vehicles_and_ghosts, fn vehicle_or_ghost -> vehicle_or_ghost.block_id end)

    incoming_trips
    |> incoming_blocks_by_route
    |> Map.new(fn {route_id, block_ids} ->
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
