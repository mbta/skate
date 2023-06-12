defmodule Realtime.Vehicles do
  alias Realtime.{Ghost, Vehicle, VehicleOrGhost}
  alias Schedule.{Block, Route, Trip}
  alias Schedule.Gtfs.{Direction, Timepoint}
  alias Schedule.Run

  @doc """
  Also fills in ghost buses and checks for buses incoming from another route

  Vehicles are incoming from another route if they're scheduled to run within 15 minutes but are currently on another route.
  """
  @spec group_by_route([Vehicle.t()], Timepoint.timepoint_names_by_id()) ::
          Route.by_id([VehicleOrGhost.t()])
  def group_by_route(ungrouped_vehicles, timepoint_names_by_id) do
    now = Util.Time.now()
    in_fifteen_minutes = now + 15 * 60

    # We show vehicles incoming from another route if they'll start the new route within 15 minutes
    incoming_trips = Schedule.active_trips(now, in_fifteen_minutes)
    # Includes runs that are scheduled to be pulling out
    active_runs_by_date = Schedule.active_runs(now, now)

    potential_interlining_blocks_by_date = Schedule.active_blocks(now, in_fifteen_minutes)

    group_by_route_with_blocks(
      ungrouped_vehicles,
      incoming_trips,
      active_runs_by_date,
      potential_interlining_blocks_by_date,
      now,
      timepoint_names_by_id
    )
  end

  @doc """
  Exposed for testing
  """
  @spec group_by_route_with_blocks(
          [Vehicle.t()],
          [Trip.t()],
          %{Date.t() => [Run.t()]},
          %{Date.t() => [Block.t()]},
          Util.Time.timestamp(),
          Timepoint.timepoint_names_by_id()
        ) ::
          Route.by_id([VehicleOrGhost.t()])
  def group_by_route_with_blocks(
        ungrouped_vehicles,
        incoming_trips,
        active_runs_by_date,
        potential_interlining_blocks_by_date,
        now,
        timepoint_names_by_id
      ) do
    ghosts = Ghost.ghosts(active_runs_by_date, ungrouped_vehicles, now, timepoint_names_by_id)
    vehicles_and_ghosts = ghosts ++ ungrouped_vehicles

    incoming_from_another_route = incoming_from_another_route(incoming_trips, vehicles_and_ghosts)

    vehicles_and_ghosts
    |> Enum.group_by(fn vehicle_or_ghost -> vehicle_or_ghost.route_id end)
    |> Map.merge(incoming_from_another_route, fn route_id, on_route, interlining ->
      {pulling_out, not_pulling_out} =
        Enum.split_with(on_route, &(&1.route_status == :pulling_out))

      date_by_block_id =
        potential_interlining_blocks_by_date
        |> Enum.flat_map(fn {date, blocks} ->
          Enum.map(blocks, &{&1.id, date})
        end)
        |> Map.new()

      not_pulling_out ++
        sort_incoming_vehicles_and_ghosts(
          route_id,
          pulling_out,
          interlining,
          incoming_trips,
          date_by_block_id
        )
    end)
  end

  @spec sort_incoming_vehicles_and_ghosts(
          Route.id(),
          [Vehicle.t() | Ghost.t()],
          [Vehicle.t() | Ghost.t()],
          [Trip.t()],
          %{Block.id() => Date.t()}
        ) :: [
          Vehicle.t() | Ghost.t()
        ]
  defp sort_incoming_vehicles_and_ghosts(
         route_id,
         pulling_out_vehicles_and_ghosts,
         interlining_vehicles_and_ghosts,
         incoming_trips,
         date_by_block_id
       ) do
    interlining_start_timestamps =
      Map.new(
        interlining_vehicles_and_ghosts,
        fn vehicle_or_ghost ->
          incoming_trip =
            incoming_trips
            |> Enum.find(fn trip ->
              trip.block_id == vehicle_or_ghost.block_id && trip.route_id == route_id
            end)

          block_date = Map.fetch!(date_by_block_id, incoming_trip.block_id)

          incoming_trip_start_timestamp =
            Util.Time.timestamp_for_time_of_day(incoming_trip.start_time, block_date)

          {vehicle_or_ghost.id, incoming_trip_start_timestamp}
        end
      )

    pulling_out_start_timestamps =
      Map.new(pulling_out_vehicles_and_ghosts, fn vehicle_or_ghost ->
        {vehicle_or_ghost.id, vehicle_or_ghost.layover_departure_time}
      end)

    incoming_start_timestamps =
      Map.merge(interlining_start_timestamps, pulling_out_start_timestamps)

    Enum.sort_by(
      interlining_vehicles_and_ghosts ++ pulling_out_vehicles_and_ghosts,
      &Map.fetch!(incoming_start_timestamps, &1.id)
    )
  end

  @spec incoming_blocks_and_directions_by_route([Trip.t()]) ::
          Route.by_id({Block.id(), Direction.id()})
  def incoming_blocks_and_directions_by_route(incoming_trips) do
    incoming_trips
    |> Enum.sort_by(& &1.start_time)
    |> Enum.group_by(fn trip -> trip.route_id end)
    |> Helpers.map_values(fn trips ->
      trips
      |> Enum.map(fn trip -> {trip.block_id, trip.direction_id} end)
      |> Enum.uniq_by(fn {block_id, _direction_id} -> block_id end)
    end)
  end

  @spec incoming_from_another_route([Trip.t()], [VehicleOrGhost.t()]) ::
          Route.by_id([VehicleOrGhost.t()])
  defp incoming_from_another_route(incoming_trips, vehicles_and_ghosts) do
    vehicles_and_ghosts_by_block =
      Enum.group_by(vehicles_and_ghosts, fn vehicle_or_ghost -> vehicle_or_ghost.block_id end)

    incoming_trips
    |> incoming_blocks_and_directions_by_route
    |> Map.new(fn {route_id, block_ids_and_directions} ->
      incoming_vehicles_and_ghosts =
        Enum.flat_map(block_ids_and_directions, fn {block_id, direction_id} ->
          vehicles_and_ghosts_by_block
          |> Map.get(block_id, [])
          # Only include vehicles who aren't currently on this route
          |> Enum.filter(fn vehicle_or_ghost -> vehicle_or_ghost.route_id != route_id end)
          |> Enum.map(fn vehicle_or_ghost ->
            %{vehicle_or_ghost | incoming_trip_direction_id: direction_id}
          end)
        end)

      {route_id, incoming_vehicles_and_ghosts}
    end)
  end
end
