defmodule Realtime.Vehicle do
  alias Gtfs.{Direction, Route, Stop, Timepoint, Trip}

  @type current_status() :: :in_transit_to | :stopped_at

  @type stop_timepoint_status() :: %{
          stop_granularity: %{
            current_status: current_status(),
            stop_id: Stop.id()
          },
          timepoint_granularity: %{
            current_status: current_status(),
            timepoint_id: Timepoint.id(),
            percent_of_the_way: non_neg_integer()
          }
        }

  @type t() :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: integer(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          current_status: current_status(),
          stop_id: Stop.id(),
          status: stop_timepoint_status()
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :current_status,
    :stop_id,
    :status
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :current_status,
    :stop_id,
    :status
  ]

  @default_opts [
    stops_on_route_fn: &Gtfs.stops_on_route/1,
    timepoints_on_route_fn: &Gtfs.timepoints_on_route/1
  ]

  @empty_timepoint %Timepoint{id: "", stop_id: ""}

  @doc """
    Argument is an Elixir object. Pass it through Jason before this function.
    json format for vehicles:
    {
      "id": "y0507",
      "vehicle": {
        "current_status": "IN_TRANSIT_TO",
        "current_stop_sequence": 3,
        "position": {
          "bearing": 0,
          "latitude": 42.35277354,
          "longitude": -71.0593878
        },
        "stop_id": "6555",
        "timestamp": 1554927574,
        "trip": {
          "direction_id": 0,
          "route_id": "505",
          "schedule_relationship": "SCHEDULED",
          "start_date": "20190410",
          "trip_id": "39984755"
        },
        "vehicle": { "id": "y0507", "label": "0507" }
      }
    }
  """
  @spec decode(term()) :: t()
  def decode(%{} = json, opts \\ []) do
    opts = Keyword.merge(@default_opts, opts)
    stops_on_route_fn = Keyword.get(opts, :stops_on_route_fn)
    timepoints_on_route_fn = Keyword.get(opts, :timepoints_on_route_fn)

    id = json["id"]
    label = json["vehicle"]["vehicle"]["label"]
    timestamp = json["vehicle"]["timestamp"]
    direction_id = json["vehicle"]["trip"]["direction_id"]
    route_id = json["vehicle"]["trip"]["route_id"]
    trip_id = json["vehicle"]["trip"]["trip_id"]
    current_status = decode_current_status(json["vehicle"]["current_status"])
    stop_id = json["vehicle"]["stop_id"]

    stops_on_route =
      try do
        stops_on_route_fn.(route_id)
      catch
        # Handle Gtfs server timeouts gracefully
        :exit, _ ->
          []
      end

    timepoints_on_route =
      try do
        timepoints_on_route_fn.(route_id)
      catch
        # Handle Gtfs server timeouts gracefully
        :exit, _ ->
          []
      end

    ordered_stops = if direction_id == 0, do: Enum.reverse(stops_on_route), else: stops_on_route

    {percent_of_the_way_to_next_timepoint, next_timepoint} =
      percent_of_the_way_to_next_timepoint(ordered_stops, timepoints_on_route, stop_id)

    %__MODULE__{
      id: id,
      label: label,
      timestamp: timestamp,
      direction_id: direction_id,
      route_id: route_id,
      trip_id: trip_id,
      current_status: current_status,
      stop_id: stop_id,
      status: %{
        stop_granularity: %{
          current_status: current_status,
          stop_id: stop_id
        },
        timepoint_granularity: %{
          current_status: timepoint_status(current_status, percent_of_the_way_to_next_timepoint),
          timepoint_id: next_timepoint.id,
          percent_of_the_way: percent_of_the_way_to_next_timepoint
        }
      }
    }
  end

  @spec percent_of_the_way_to_next_timepoint([Stop.id()], [Timepoint.t()], Stop.id()) :: {
          non_neg_integer(),
          Timepoint.t()
        }

  def percent_of_the_way_to_next_timepoint(stop_ids, _timepoints, _stop_id)
      when is_list(stop_ids) and length(stop_ids) == 0,
      do: {0, @empty_timepoint}

  def percent_of_the_way_to_next_timepoint(stop_ids, timepoints, stop_id) do
    {past_stop_ids, future_stop_ids} = split_stops(stop_ids, stop_id)

    next_timepoint_stop_id =
      Enum.find([stop_id | future_stop_ids], &is_a_timepoint?(&1, timepoints))

    next_timepoint =
      Enum.find(timepoints, &(&1.stop_id == next_timepoint_stop_id)) || @empty_timepoint

    count_to_previous_timepoint = count_to_timepoint(past_stop_ids, timepoints)
    count_to_next_timepoint = count_to_timepoint(future_stop_ids, timepoints)

    {
      percent_of_the_way(count_to_previous_timepoint, count_to_next_timepoint),
      next_timepoint
    }
  end

  @spec split_stops([Stop.id()], Stop.id()) :: {[Stop.id()], [Stop.id()]}
  defp split_stops(stop_ids, stop_id) do
    stop_index = Enum.find_index(stop_ids, &(&1 == stop_id))
    split_stops_on_index(stop_ids, stop_index)
  end

  @spec split_stops_on_index([Stop.id()], non_neg_integer() | nil) :: {[Stop.id()], [Stop.id()]}
  defp split_stops_on_index(_stop_ids, nil), do: {[], []}

  defp split_stops_on_index(stop_ids, index) do
    {past, [_current | future]} = Enum.split(stop_ids, index)

    {Enum.reverse(past), future}
  end

  @spec count_to_timepoint([Stop.id()], [Timepoint.t()]) :: non_neg_integer()
  defp count_to_timepoint(stop_ids, timepoints) do
    count = Enum.find_index(stop_ids, &is_a_timepoint?(&1, timepoints))

    if is_number(count), do: count + 1, else: 0
  end

  @spec is_a_timepoint?(Stop.id(), [Timepoint.t()]) :: boolean
  defp is_a_timepoint?(stop_id, timepoints), do: Enum.any?(timepoints, &(&1.stop_id == stop_id))

  @spec percent_of_the_way(non_neg_integer(), non_neg_integer()) :: non_neg_integer()
  defp percent_of_the_way(past_count, future_count) do
    if past_count + future_count == 0 do
      0
    else
      Kernel.trunc(
        past_count / (past_count + future_count) *
          100
      )
    end
  end

  @spec timepoint_status(current_status(), integer) :: current_status()
  defp timepoint_status(:in_transit_to, _percent_of_the_way), do: :in_transit_to

  defp timepoint_status(:stopped_at, percent_of_the_way),
    do: if(percent_of_the_way == 100, do: :stopped_at, else: :in_transit_to)

  @spec decode_current_status(String.t()) :: current_status()
  defp decode_current_status("IN_TRANSIT_TO"), do: :in_transit_to
  defp decode_current_status("INCOMING_AT"), do: :in_transit_to
  defp decode_current_status("STOPPED_AT"), do: :stopped_at
end
