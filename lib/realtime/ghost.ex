defmodule Realtime.Ghost do
  alias Gtfs.{Block, Direction, Route, RoutePattern, Run, StopTime, Trip}
  alias Realtime.RouteStatus
  alias Realtime.TimepointStatus
  alias Realtime.Vehicle

  @type t :: %__MODULE__{
          id: String.t(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          headsign: String.t(),
          block_id: Block.id(),
          run_id: Run.id(),
          via_variant: RoutePattern.via_variant() | nil,
          layover_departure_time: Util.Time.timestamp() | nil,
          scheduled_timepoint_status: TimepointStatus.timepoint_status(),
          route_status: RouteStatus.route_status()
        }

  @enforce_keys [
    :id,
    :direction_id,
    :route_id,
    :trip_id,
    :headsign,
    :block_id,
    :scheduled_timepoint_status,
    :route_status
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :direction_id,
    :route_id,
    :trip_id,
    :headsign,
    :block_id,
    :run_id,
    :via_variant,
    :layover_departure_time,
    :scheduled_timepoint_status,
    :route_status
  ]

  @spec ghosts([Trip.t()], %{Block.id() => [Vehicle.t()]}, Util.Time.timestamp()) :: [t()]
  def ghosts(trips, vehicles_by_block_id, now) do
    trips
    |> Enum.reject(fn trip ->
      Map.has_key?(vehicles_by_block_id, trip.block_id)
    end)
    |> Enum.map(fn trip ->
      timepoints = Enum.filter(trip.stop_times, &StopTime.is_timepoint?/1)

      case timepoints do
        [] ->
          nil

        _ ->
          now_time_of_day =
            Util.Time.next_time_of_day_for_timestamp_after(now, Trip.start_time(trip))

          timepoint_status =
            TimepointStatus.scheduled_timepoint_status(timepoints, now_time_of_day)

          %__MODULE__{
            id: "ghost-#{trip.id}",
            direction_id: trip.direction_id,
            route_id: trip.route_id,
            trip_id: trip.id,
            headsign: trip.headsign,
            block_id: trip.block_id,
            run_id: trip.run_id,
            via_variant: trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id),
            layover_departure_time: nil,
            scheduled_timepoint_status: timepoint_status,
            route_status: :on_route
          }
      end
    end)
    |> Enum.filter(& &1)
  end
end
