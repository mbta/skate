defmodule Schedule.Trip do
  alias Schedule.Block
  alias Schedule.Gtfs
  alias Schedule.Gtfs.{Direction, Route, RoutePattern, Service, Shape, StopTime}
  alias Schedule.Hastus
  alias Schedule.Hastus.Run

  @type id :: String.t()

  @type by_id :: %{id() => t()}

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
          schedule_id: Hastus.Schedule.id() | nil,
          run_id: Run.id() | nil,
          stop_times: [StopTime.t()],
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: String.t(),
          end_place: String.t()
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
    schedule_id: nil,
    run_id: nil,
    stop_times: [],
    start_time: 0,
    end_time: 0,
    start_place: "",
    end_place: ""
  ]

  @spec merge_trips([Gtfs.Trip.t()], [Hastus.Trip.t()], StopTime.by_trip_id()) :: by_id()
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
    {start_time, end_time} =
      if stop_times do
        stop_times |> Enum.map(& &1.time) |> Enum.min_max()
      else
        {hastus_trip.start_time, hastus_trip.end_time}
      end

    %__MODULE__{
      id: (gtfs_trip && gtfs_trip.id) || (hastus_trip && hastus_trip.trip_id),
      block_id: (gtfs_trip && gtfs_trip.block_id) || (hastus_trip && hastus_trip.block_id),
      route_id: (gtfs_trip && gtfs_trip.route_id) || (hastus_trip && hastus_trip.route_id),
      service_id: gtfs_trip && gtfs_trip.service_id,
      headsign: gtfs_trip && gtfs_trip.headsign,
      direction_id: gtfs_trip && gtfs_trip.direction_id,
      route_pattern_id: gtfs_trip && gtfs_trip.route_pattern_id,
      shape_id: gtfs_trip && gtfs_trip.shape_id,
      schedule_id: hastus_trip && hastus_trip.schedule_id,
      run_id: hastus_trip && hastus_trip.run_id,
      stop_times: stop_times || [],
      start_time: start_time,
      end_time: end_time,
      start_place: hastus_trip && hastus_trip.start_place,
      end_place: hastus_trip && hastus_trip.end_place
    }
  end

  @doc """
  Whether the trip is active at any time during the time_of_day range.
  """
  @spec is_active(t(), Util.Time.time_of_day(), Util.Time.time_of_day()) :: boolean()
  def is_active(trip, start_time_of_day, end_time_of_day) do
    end_time_of_day > trip.start_time and
      start_time_of_day < trip.end_time
  end

  @spec id_sans_overload(id() | nil) :: id() | nil
  def id_sans_overload(nil), do: nil

  def id_sans_overload(id), do: String.replace(id, ~r/-OL.+$/, "")
end
