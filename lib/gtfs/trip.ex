defmodule Gtfs.Trip do
  alias Gtfs.Block
  alias Gtfs.Csv
  alias Gtfs.Direction
  alias Gtfs.Route
  alias Gtfs.RoutePattern
  alias Gtfs.Service
  alias Gtfs.StopTime

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id(),
          service_id: Service.id(),
          headsign: String.t(),
          direction_id: Direction.id(),
          block_id: Block.id(),
          # Shuttles do not have route_pattern_ids
          route_pattern_id: RoutePattern.id() | nil,
          stop_times: [StopTime.t()]
        }

  @enforce_keys [
    :id,
    :route_id,
    :service_id,
    :headsign,
    :direction_id,
    :block_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :service_id,
    :headsign,
    :direction_id,
    :block_id,
    :route_pattern_id,
    stop_times: []
  ]

  defmodule OnDate do
    alias Gtfs.Trip

    @type t :: %__MODULE__{
            id: Trip.id(),
            route_id: Route.id(),
            headsign: String.t(),
            direction_id: Direction.id(),
            block_id: Block.id(),
            # Shuttles do not have route_pattern_ids
            route_pattern_id: RoutePattern.id() | nil,
            stop_times: [StopTime.OnDate.t()]
          }

    @enforce_keys [
      :id,
      :route_id,
      :headsign,
      :direction_id,
      :block_id
    ]

    @derive Jason.Encoder

    defstruct [
      :id,
      :route_id,
      :headsign,
      :direction_id,
      :block_id,
      :route_pattern_id,
      stop_times: []
    ]
  end

  @spec on_date(t(), Date.t()) :: OnDate.t()
  def on_date(trip, date) do
    %OnDate{
      id: trip.id,
      route_id: trip.route_id,
      headsign: trip.headsign,
      direction_id: trip.direction_id,
      block_id: trip.block_id,
      route_pattern_id: trip.route_pattern_id,
      stop_times:
        Enum.map(
          trip.stop_times,
          fn stop_time -> StopTime.on_date(stop_time, date) end
        )
    }
  end

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    route_pattern_id =
      case row["route_pattern_id"] do
        "" -> nil
        route_pattern_id -> route_pattern_id
      end

    %__MODULE__{
      id: row["trip_id"],
      route_id: row["route_id"],
      service_id: row["service_id"],
      headsign: row["trip_headsign"],
      direction_id: Direction.id_from_string(row["direction_id"]),
      block_id: row["block_id"],
      route_pattern_id: route_pattern_id
    }
  end

  @spec row_in_route_id_set?(Csv.row(), MapSet.t(Route.id())) :: boolean
  def row_in_route_id_set?(row, route_id_set), do: MapSet.member?(route_id_set, row["route_id"])

  @spec start_time(t()) :: Util.Time.time_of_day()
  def start_time(trip) do
    List.first(trip.stop_times).time
  end

  @spec end_time(t()) :: Util.Time.time_of_day()
  def end_time(trip) do
    List.last(trip.stop_times).time
  end
end
