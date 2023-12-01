defmodule Realtime.Ghost do
  @moduledoc false

  alias Schedule.{AsDirected, Block, Route, Trip}
  alias Schedule.Gtfs.{Direction, RoutePattern, StopTime, Timepoint}
  alias Schedule.Piece
  alias Schedule.Run
  alias Realtime.{BlockWaiver, BlockWaiverStore, RouteStatus, TimepointStatus, Vehicle}

  @type t :: %__MODULE__{
          id: String.t(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          headsign: String.t(),
          block_id: Block.id(),
          run_id: Schedule.Hastus.Run.id() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          incoming_trip_direction_id: Direction.id() | nil,
          layover_departure_time: Util.Time.timestamp() | nil,
          scheduled_timepoint_status: TimepointStatus.timepoint_status(),
          scheduled_logon: Util.Time.timestamp() | nil,
          route_status: RouteStatus.route_status(),
          block_waivers: [BlockWaiver.t()],
          current_piece_start_place: String.t() | nil,
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
    :incoming_trip_direction_id,
    :layover_departure_time,
    :scheduled_timepoint_status,
    :scheduled_logon,
    :route_status,
    :current_piece_start_place,
    :current_piece_first_route,
    block_waivers: []
  ]

  @spec ghosts(
          %{Date.t() => [Run.t()]},
          [Vehicle.t()],
          Util.Time.timestamp(),
          Timepoint.timepoint_names_by_id()
        ) ::
          [t()]
  def ghosts(runs_by_date, vehicles, now, timepoint_names_by_id) do
    runs_with_vehicles = MapSet.new(vehicles, fn vehicle -> vehicle.run_id end)

    runs_by_date
    |> Helpers.map_values(fn runs ->
      Enum.reject(runs, fn run ->
        MapSet.member?(runs_with_vehicles, run.id)
      end)
    end)
    |> Enum.flat_map(fn {date, runs} ->
      runs
      |> Enum.map(fn run ->
        ghost_for_run(run, date, now, timepoint_names_by_id)
      end)
      |> Enum.filter(& &1)
    end)
  end

  @spec ghost_for_run(Run.t(), Date.t(), Util.Time.timestamp(), Timepoint.timepoint_names_by_id()) ::
          t() | nil
  def ghost_for_run(run, date, now, timepoint_names_by_id) do
    now_time_of_day = Util.Time.time_of_day_for_timestamp(now, date)

    current_piece_trips =
      run
      |> Run.pieces()
      |> Enum.find(&Piece.is_for_now?(&1, now_time_of_day))
      |> case do
        %Piece{start_mid_route?: %{trip: trip}, trips: trips} ->
          [trip | trips]

        %Piece{trips: trips} ->
          trips

        _ ->
          []
      end
      |> Enum.sort_by(fn trip -> trip.start_time end)

    case current_trip(current_piece_trips, now_time_of_day) do
      nil ->
        nil

      {_route_status, %AsDirected{}} ->
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

            current_piece =
              with pieces <- Run.pieces(run),
                   [current_piece] <-
                     Enum.filter(pieces, &Piece.is_for_now?(&1, now_time_of_day)) do
                current_piece
              else
                _ -> nil
              end

            current_piece_start_place =
              case current_piece do
                nil ->
                  nil

                current_piece ->
                  Map.get(
                    timepoint_names_by_id,
                    current_piece.start_place,
                    current_piece.start_place
                  )
              end

            current_piece_first_route =
              with first_revenue_trip <-
                     Enum.find(current_piece_trips, fn trip ->
                       !is_nil(trip.route_id)
                     end),
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
              block_id: trip.block_id,
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
              block_waivers:
                block_waivers_for_block_and_service_fn.(trip.block_id, trip.schedule_id),
              current_piece_start_place: current_piece_start_place,
              current_piece_first_route: current_piece_first_route
            }
        end
    end
  end

  @doc """
  If the run isn't scheduled to have started yet, or if it's still scheduled to be on a trip without a route
  ID, it's pulling out to the first revenue trip.
  If a trip in the run is scheduled to be in progress, it's on_route for that trip.
  If the run is scheduled to be between trips, it's laying_over and returns the next trip that will start
  If the run is scheduled to have finished, returns nil,
  """
  @spec current_trip([Trip.t() | Schedule.AsDirected.t()], Util.Time.time_of_day()) ::
          {RouteStatus.route_status(), Trip.t() | Schedule.AsDirected.t()} | nil
  def current_trip([], _now_time_of_day) do
    nil
  end

  def current_trip([trip | later_trips], now_time_of_day) do
    cond do
      now_time_of_day < trip.start_time ->
        {:pulling_out, trip}

      match?(%Trip{route_id: nil}, trip) and now_time_of_day < trip.end_time ->
        case later_trips do
          [next_trip | _] -> {:pulling_out, next_trip}
          _ -> nil
        end

      true ->
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
