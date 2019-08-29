defmodule Realtime.Ghost do
  alias Gtfs.{Block, Direction, Route, RoutePattern, StopTime, Trip}
  alias Realtime.TimepointStatus
  alias Realtime.Vehicle

  @type t :: %__MODULE__{
          id: String.t(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          block_id: Block.id(),
          via_variant: RoutePattern.via_variant() | nil,
          scheduled_timepoint_status: TimepointStatus.timepoint_status()
        }

  @enforce_keys [
    :id,
    :direction_id,
    :route_id,
    :trip_id,
    :block_id,
    :scheduled_timepoint_status
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :direction_id,
    :route_id,
    :trip_id,
    :block_id,
    :via_variant,
    :scheduled_timepoint_status
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
            block_id: trip.block_id,
            via_variant: trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id),
            scheduled_timepoint_status: timepoint_status
          }
      end
    end)
    |> Enum.filter(& &1)
  end
end
