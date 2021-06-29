defmodule Realtime.Ghost do
  alias Schedule.{Block, Route, Trip}
  alias Schedule.Gtfs.{Direction, RoutePattern, StopTime}
  alias Schedule.Hastus.Run
  alias Realtime.{BlockWaiver, BlockWaiverStore, RouteStatus, TimepointStatus, Vehicle}

  @type t :: %__MODULE__{
          id: String.t(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          headsign: String.t(),
          block_id: Block.id(),
          run_id: Run.id() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          layover_departure_time: Util.Time.timestamp() | nil,
          scheduled_timepoint_status: TimepointStatus.timepoint_status(),
          scheduled_logon: Util.Time.timestamp() | nil,
          route_status: RouteStatus.route_status(),
          block_waivers: [BlockWaiver.t()],
          current_piece_start_place: Schedule.Hastus.Place.id() | nil,
          current_piece_first_route: Route.id() | nil
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
    :scheduled_logon,
    :route_status,
    :current_piece_start_place,
    :current_piece_first_route,
    block_waivers: []
  ]

  @spec ghosts(%{Date.t() => [Block.t()]}, [Vehicle.t()], Util.Time.timestamp()) ::
          [t()]
  def ghosts(blocks_by_date, vehicles, now) do
    blocks_with_vehicles = MapSet.new(vehicles, fn vehicle -> vehicle.block_id end)

    blocks_by_date
    |> Helpers.map_values(fn blocks ->
      Enum.reject(blocks, fn block ->
        MapSet.member?(blocks_with_vehicles, block.id)
      end)
    end)
    |> Enum.flat_map(fn {date, blocks} ->
      blocks
      |> Enum.map(fn block ->
        ghost_for_block(block, date, now)
      end)
      |> Enum.filter(& &1)
    end)
  end

  @spec ghost_for_block(Block.t(), Date.t(), Util.Time.timestamp()) :: t() | nil
  def ghost_for_block(block, date, now) do
    now_time_of_day = Util.Time.time_of_day_for_timestamp(now, date)

    case current_trip(block.trips, now_time_of_day) do
      nil ->
        nil

      {route_status, trip} ->
        timepoints = Enum.filter(trip.stop_times, &StopTime.is_timepoint?/1)

        case timepoints do
          [] ->
            nil

          _ ->
            block_waivers_for_block_and_service_fn =
              Application.get_env(
                :realtime,
                :block_waivers_for_block_and_service_fn,
                &BlockWaiverStore.block_waivers_for_block_and_service/2
              )

            timepoint_status =
              TimepointStatus.scheduled_timepoint_status(timepoints, now_time_of_day)

            block_fn = Application.get_env(:skate, :block_fn, &Schedule.minischedule_block/1)

            current_piece =
              with %Schedule.Minischedule.Block{pieces: pieces} <- block_fn.(trip.id),
                   [current_piece] <-
                     Enum.filter(pieces, fn piece ->
                       piece.start_time <= now_time_of_day && piece.end_time >= now_time_of_day
                     end) do
                current_piece
              else
                _ -> nil
              end

            current_piece_start_place =
              case current_piece do
                nil -> nil
                current_piece -> current_piece.start_place
              end

            current_piece_first_route =
              with false <- is_nil(current_piece),
                   first_revenue_trip <-
                     if(current_piece.start_mid_route?,
                       do: current_piece.start_mid_route?.trip,
                       else:
                         Enum.find(current_piece.trips, fn trip ->
                           match?(%Schedule.Minischedule.Trip{}, trip) && !is_nil(trip.route_id)
                         end)
                     ),
                   false <- is_nil(first_revenue_trip) do
                first_revenue_trip.route_id
              else
                _ -> nil
              end

            %__MODULE__{
              id: "ghost-#{trip.id}",
              direction_id: trip.direction_id,
              route_id: trip.route_id,
              trip_id: trip.id,
              headsign: trip.headsign,
              block_id: block.id,
              run_id: trip.run_id,
              via_variant:
                trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id),
              layover_departure_time:
                if route_status == :laying_over || route_status == :pulling_out do
                  Util.Time.timestamp_for_time_of_day(
                    trip.start_time,
                    date
                  )
                else
                  nil
                end,
              scheduled_timepoint_status: timepoint_status,
              scheduled_logon:
                if current_piece do
                  Util.Time.timestamp_for_time_of_day(current_piece.start_time, date)
                else
                  nil
                end,
              route_status: route_status,
              block_waivers: block_waivers_for_block_and_service_fn.(block.id, block.service_id),
              current_piece_start_place: current_piece_start_place,
              current_piece_first_route: current_piece_first_route
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
  @spec current_trip([Trip.t()], Util.Time.time_of_day()) ::
          {RouteStatus.route_status(), Trip.t()} | nil
  def current_trip([], _now_time_of_day) do
    nil
  end

  def current_trip([trip | later_trips], now_time_of_day) do
    if now_time_of_day < trip.start_time do
      {:pulling_out, trip}
    else
      case current_trip(later_trips, now_time_of_day) do
        nil ->
          # the current trip is the last trip
          # has it finished?
          if now_time_of_day > trip.end_time do
            nil
          else
            {:on_route, trip}
          end

        {:pulling_out, next_trip} ->
          # the next trip hasn't started yet.
          # are we in between trips or still in the current trip?
          if now_time_of_day > trip.end_time do
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
