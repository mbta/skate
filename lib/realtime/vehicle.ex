defmodule Realtime.Vehicle do
  alias Gtfs.{Direction, Route, Stop, StopTime, Trip}

  @type current_status() :: :in_transit_to | :stopped_at

  @type t() :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: integer(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          current_stop_status: current_status(),
          stop_id: Stop.id(),
          current_timepoint_status: current_status(),
          timepoint_id: StopTime.timepoint_id(),
          percent_of_the_way_to_timepoint: non_neg_integer()
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :current_stop_status,
    :stop_id,
    :current_timepoint_status,
    :timepoint_id,
    :percent_of_the_way_to_timepoint
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :current_stop_status,
    :stop_id,
    :current_timepoint_status,
    :timepoint_id,
    :percent_of_the_way_to_timepoint
  ]

  @default_opts [
    stop_times_on_trip_fn: &Gtfs.stop_times_on_trip/1
  ]

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
  @spec decode(term(), keyword) :: t()
  def decode(%{} = json, opts \\ []) do
    opts = Keyword.merge(@default_opts, opts)
    stop_times_on_trip_fn = Keyword.get(opts, :stop_times_on_trip_fn)

    id = json["id"]
    label = json["vehicle"]["vehicle"]["label"]
    timestamp = json["vehicle"]["timestamp"]
    direction_id = json["vehicle"]["trip"]["direction_id"]
    route_id = json["vehicle"]["trip"]["route_id"]
    trip_id = json["vehicle"]["trip"]["trip_id"]
    current_stop_status = decode_current_status(json["vehicle"]["current_status"])
    stop_id = json["vehicle"]["stop_id"]

    stop_times_on_trip =
      try do
        stop_times_on_trip_fn.(trip_id)
      catch
        # Handle Gtfs server timeouts gracefully
        :exit, _ ->
          []
      end

    {percent_of_the_way_to_next_timepoint, next_timepoint_stop_time} =
      percent_of_the_way_to_next_timepoint(stop_times_on_trip, stop_id)

    %__MODULE__{
      id: id,
      label: label,
      timestamp: timestamp,
      direction_id: direction_id,
      route_id: route_id,
      trip_id: trip_id,
      current_stop_status: current_stop_status,
      stop_id: stop_id,
      current_timepoint_status:
        timepoint_status(current_stop_status, next_timepoint_stop_time, stop_id),
      timepoint_id: next_timepoint_id(next_timepoint_stop_time),
      percent_of_the_way_to_timepoint: percent_of_the_way_to_next_timepoint
    }
  end

  @spec percent_of_the_way_to_next_timepoint([StopTime.t()], Stop.id()) :: {
          non_neg_integer(),
          StopTime.t() | nil
        }
  def percent_of_the_way_to_next_timepoint([], _stop_id), do: {0, nil}

  def percent_of_the_way_to_next_timepoint(stop_times, stop_id) do
    {past_stop_times, current_stop_time, future_stop_times} =
      split_stop_times(stop_times, stop_id)

    next_timepoint_stop_time =
      Enum.find([current_stop_time | future_stop_times], &is_a_timepoint?(&1))

    {
      percent_of_the_way(
        count_to_timepoint(past_stop_times),
        count_to_timepoint(future_stop_times)
      ),
      next_timepoint_stop_time
    }
  end

  @spec split_stop_times([StopTime.t()], Stop.id()) ::
          {[StopTime.t()], StopTime.t() | nil, [StopTime.t()]}
  defp split_stop_times(stop_times, stop_id) do
    index = Enum.find_index(stop_times, &(&1.stop_id == stop_id))
    split_stop_times_on_index(stop_times, index)
  end

  @spec split_stop_times_on_index([StopTime.t()], non_neg_integer() | nil) ::
          {[StopTime.t()], StopTime.t() | nil, [StopTime.t()]}
  defp split_stop_times_on_index(_stop_times, nil), do: {[], nil, []}

  defp split_stop_times_on_index(stop_times, index) do
    {past, [current | future]} = Enum.split(stop_times, index)

    {Enum.reverse(past), current, future}
  end

  @spec count_to_timepoint([StopTime.t()]) :: non_neg_integer()
  defp count_to_timepoint(stop_times) do
    count = Enum.find_index(stop_times, &is_a_timepoint?(&1))

    if is_number(count), do: count + 1, else: 0
  end

  @spec is_a_timepoint?(StopTime.t()) :: boolean
  defp is_a_timepoint?(nil), do: false
  defp is_a_timepoint?(stop_time), do: stop_time.timepoint_id != ""

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

  @spec timepoint_status(current_status(), StopTime.t(), Stop.id()) :: current_status()
  defp timepoint_status(:in_transit_to, _next_timepoint_stop_time, _stop_id), do: :in_transit_to

  defp timepoint_status(:stopped_at, nil, _stop_id), do: :in_transit_to

  defp timepoint_status(:stopped_at, next_timepoint_stop_time, stop_id),
    do: if(next_timepoint_stop_time.stop_id == stop_id, do: :stopped_at, else: :in_transit_to)

  @spec decode_current_status(String.t()) :: current_status()
  defp decode_current_status("IN_TRANSIT_TO"), do: :in_transit_to
  defp decode_current_status("INCOMING_AT"), do: :in_transit_to
  defp decode_current_status("STOPPED_AT"), do: :stopped_at

  @spec next_timepoint_id(StopTime.t() | nil) :: StopTime.timepoint_id() | nil
  defp next_timepoint_id(nil), do: nil
  defp next_timepoint_id(%StopTime{timepoint_id: timepoint_id}), do: timepoint_id
end
