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

  @spec ghosts([Block.t()], %{Block.id() => [Vehicle.t()]}, Util.Time.timestamp()) :: [t()]
  def ghosts(blocks, vehicles_by_block_id, now) do
    blocks
    |> Enum.reject(fn block ->
      Map.has_key?(vehicles_by_block_id, List.first(block).block_id)
    end)
    |> Enum.map(fn block ->
      ghost_for_block(block, now)
    end)
    |> Enum.filter(& &1)
  end

  @spec ghost_for_block(Block.t(), Util.Time.timestamp()) :: t() | nil
  def ghost_for_block(block, now) do
    now_time_of_day =
      Util.Time.next_time_of_day_for_timestamp_after(
        now,
        Util.Time.time_of_day_add_minutes(Block.start_time(block), -60)
      )

    case current_trip(block, now_time_of_day) do
      nil ->
        nil

      {route_status, trip} ->
        timepoints = Enum.filter(trip.stop_times, &StopTime.is_timepoint?/1)

        case timepoints do
          [] ->
            nil

          _ ->
            timepoint_status =
              TimepointStatus.scheduled_timepoint_status(timepoints, now_time_of_day)

            %__MODULE__{
              id: "ghost-#{trip.id}",
              direction_id: trip.direction_id,
              route_id: trip.route_id,
              trip_id: trip.id,
              headsign: trip.headsign,
              block_id: List.first(block).block_id,
              run_id: trip.run_id,
              via_variant:
                trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id),
              layover_departure_time:
                if route_status == :laying_over || route_status == :pulling_out do
                  Util.Time.next_timestamp_for_time_of_day_after(
                    Trip.start_time(trip),
                    now
                  )
                else
                  nil
                end,
              scheduled_timepoint_status: timepoint_status,
              route_status: route_status
            }
        end
    end
  end

  @doc """
  If the block isn't scheduled to have started yet, it's pulling out to the first trip.
  If a trip in the block is scheduled to be in progress, it's on_route for that trip.
  If the block is scheduled to be between trips, it's laying_over and returns the next trip that will start
  If the block is scheduled to have finished, returns nil,
  """
  @spec current_trip(Block.t(), Util.Time.time_of_day()) ::
          {RouteStatus.route_status(), Trip.t()} | nil
  def current_trip([], _now_time_of_day) do
    nil
  end

  def current_trip([trip | later_trips], now_time_of_day) do
    if now_time_of_day < Trip.start_time(trip) do
      {:pulling_out, trip}
    else
      case current_trip(later_trips, now_time_of_day) do
        nil ->
          # the current trip is the last trip
          # has it finished?
          if now_time_of_day > Trip.end_time(trip) do
            nil
          else
            {:on_route, trip}
          end

        {:pulling_out, next_trip} ->
          # the next trip hasn't started yet.
          # are we in between trips or still in the current trip?
          if now_time_of_day > Trip.end_time(trip) do
            {:laying_over, next_trip}
          else
            {:on_route, trip}
          end

        status_and_trip ->
          status_and_trip
      end
    end
  end
end
