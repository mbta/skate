defmodule Schedule.Trip do
  alias Schedule.Block
  alias Schedule.Gtfs
  alias Schedule.Gtfs.{Direction, Route, RoutePattern, Service, Shape, StopTime}
  alias Schedule.Hastus.Run

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id(),
          block_id: Block.id(),
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
    :route_id,
    :block_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :block_id,
    service_id: nil,
    headsign: nil,
    direction_id: nil,
    route_pattern_id: nil,
    shape_id: nil,
    stop_times: [],
    run_id: nil
  ]

  @spec merge(Gtfs.Trip.t(), [StopTime.t()], Run.id() | nil) :: t()
  def merge(gtfs_trip, stop_times, run_id) do
    %__MODULE__{
      id: gtfs_trip.id,
      route_id: gtfs_trip.route_id,
      block_id: gtfs_trip.block_id,
      service_id: gtfs_trip.service_id,
      headsign: gtfs_trip.headsign,
      direction_id: gtfs_trip.direction_id,
      route_pattern_id: gtfs_trip.route_pattern_id,
      shape_id: gtfs_trip.shape_id,
      run_id: run_id,
      stop_times: stop_times
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
