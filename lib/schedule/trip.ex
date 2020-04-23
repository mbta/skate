defmodule Schedule.Trip do
  alias Schedule.Block
  alias Schedule.Gtfs
  alias Schedule.Gtfs.{Direction, Route, RoutePattern, Service, Shape, StopTime}
  alias Schedule.Hastus
  alias Schedule.Hastus.Run

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          block_id: Block.id(),
          route_id: Route.id() | nil,
          service_id: Service.id() | nil,
          headsign: String.t() | nil,
          direction_id: Direction.id() | nil,
          # Shuttles do not have route_pattern_ids
          route_pattern_id: RoutePattern.id() | nil,
          shape_id: Shape.id() | nil,
          run_id: Run.id() | nil,
          stop_times: [StopTime.t()]
        }

  @enforce_keys [
    :id,
    :block_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :block_id,
    route_id: nil,
    service_id: nil,
    headsign: nil,
    direction_id: nil,
    route_pattern_id: nil,
    shape_id: nil,
    run_id: nil,
    stop_times: []
  ]

  @spec merge_trips([Gtfs.Trip.t()], [Hastus.Trip.t()], %{id() => [StopTime.t()]}) :: %{
          id() => t()
        }
  def merge_trips(gtfs_trips, hastus_trips, stop_times_by_id) do
    gtfs_trips_by_id = Map.new(gtfs_trips, fn trip -> {trip.id, trip} end)
    hastus_trips_by_id = Map.new(hastus_trips, fn trip -> {trip.trip_id, trip} end)

    [
      gtfs_trips_by_id,
      hastus_trips_by_id,
      stop_times_by_id
    ]
    |> Schedule.Helpers.zip_maps()
    |> Helpers.map_values(fn [gtfs_trip, hastus_trip, stop_times] ->
      merge(gtfs_trip, hastus_trip, stop_times)
    end)
  end

  @spec merge(Gtfs.Trip.t() | nil, Hastus.Trip.t() | nil, [StopTime.t()] | nil) :: t()
  def merge(gtfs_trip, hastus_trip, stop_times) when gtfs_trip != nil or hastus_trip != nil do
    %__MODULE__{
      id: (gtfs_trip && gtfs_trip.id) || (hastus_trip && hastus_trip.trip_id),
      block_id: (gtfs_trip && gtfs_trip.block_id) || (hastus_trip && hastus_trip.block_id),
      route_id: (gtfs_trip && gtfs_trip.route_id) || (hastus_trip && hastus_trip.route_id),
      service_id: gtfs_trip && gtfs_trip.service_id,
      headsign: gtfs_trip && gtfs_trip.headsign,
      direction_id: gtfs_trip && gtfs_trip.direction_id,
      route_pattern_id: gtfs_trip && gtfs_trip.route_pattern_id,
      shape_id: gtfs_trip && gtfs_trip.shape_id,
      run_id: hastus_trip && hastus_trip.run_id,
      stop_times: stop_times || []
    }
  end

  @spec start_time(t()) :: Util.Time.time_of_day()
  def start_time(%__MODULE__{stop_times: stop_times}) do
    List.first(stop_times).time
  end

  @spec end_time(t()) :: Util.Time.time_of_day()
  def end_time(%__MODULE__{stop_times: stop_times}) do
    List.last(stop_times).time
  end

  @doc """
  Whether the trip is active at any time during the time_of_day range.
  """
  @spec is_active(t(), Util.Time.time_of_day(), Util.Time.time_of_day()) :: bool
  def is_active(trip, start_time_of_day, end_time_of_day) do
    end_time_of_day > start_time(trip) and
      start_time_of_day < end_time(trip)
  end

  @spec id_sans_overload(id() | nil) :: id() | nil
  def id_sans_overload(nil), do: nil

  def id_sans_overload(id), do: String.replace(id, ~r/-OL.+$/, "")
end
