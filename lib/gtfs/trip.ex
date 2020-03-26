defmodule Gtfs.Trip do
  alias Gtfs.{Block, Csv, Direction, Route, RoutePattern, Run, Service, Shape, Stop, StopTime}

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
          shape_id: Shape.id(),
          run_id: Run.id() | nil,
          stop_times: [StopTime.t()]
        }

  @enforce_keys [
    :id,
    :route_id,
    :service_id,
    :headsign,
    :direction_id,
    :block_id,
    :shape_id
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
    :shape_id,
    run_id: nil,
    stop_times: []
  ]

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
      route_pattern_id: route_pattern_id,
      shape_id: row["shape_id"]
    }
  end

  @spec row_in_route_id_set?(Csv.row(), MapSet.t(Route.id())) :: boolean
  def row_in_route_id_set?(row, route_id_set), do: MapSet.member?(route_id_set, row["route_id"])

  @spec start_time(t()) :: Util.Time.time_of_day()
  def start_time(%__MODULE__{stop_times: stop_times}) do
    List.first(stop_times).time
  end

  @spec end_time(t()) :: Util.Time.time_of_day()
  def end_time(%__MODULE__{stop_times: stop_times}) do
    List.last(stop_times).time
  end

  @spec time_of_first_stop_matching(t(), [Stop.id()]) :: Util.Time.time_of_day()
  def time_of_first_stop_matching(%__MODULE__{stop_times: stop_times}, stop_ids) do
    time_of_stop_matching(stop_times, stop_ids)
  end

  @spec time_of_last_stop_matching(t(), [Stop.id()]) :: Util.Time.time_of_day()
  def time_of_last_stop_matching(%__MODULE__{stop_times: stop_times}, stop_ids) do
    stop_times
    |> Enum.reverse()
    |> time_of_stop_matching(stop_ids)
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

  @spec time_of_stop_matching([StopTime.t()], [Stop.id()]) :: Util.Time.time_of_day()
  defp time_of_stop_matching(stop_times, stop_ids) do
    stop_times
    |> Enum.find(&is_in_list_of_stop_ids(&1, stop_ids))
    |> Map.get(:time)
  end

  defp is_in_list_of_stop_ids(stop_time, stop_ids), do: Enum.member?(stop_ids, stop_time.stop_id)
end
