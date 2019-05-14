defmodule Realtime.Vehicle do
  alias Gtfs.{Direction, Route, Stop, StopTime, Trip}

  @type current_status :: :in_transit_to | :stopped_at
  @type stop_status :: %{
          status: current_status(),
          stop_id: Stop.id()
        }
  @typedoc """
  fraction_until_timepoint ranges
    from 0.0 (inclusive) if the vehicle is at the given timepoint
    to 1.0 (exclusive) if the vehicle has just left the previous timepoint
  """
  @type timepoint_status ::
          %{
            status: current_status(),
            timepoint_id: StopTime.possible_timepoint_id(),
            fraction_until_timepoint: float()
          }
          | nil

  @type t :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: integer(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          stop_status: stop_status(),
          timepoint_status: timepoint_status()
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :stop_status
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :stop_status,
    :timepoint_status
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
  @spec decode(term()) :: t()
  def decode(%{} = json) do
    stop_times_on_trip_fn =
      Application.get_env(:realtime, :stop_times_on_trip_fn, &Gtfs.stop_times_on_trip/1)

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

    timepoint_status =
      with {fraction_until_timepoint, next_timepoint_stop_time} <-
             fraction_until_timepoint(stop_times_on_trip, stop_id),
           current_timepoint_status <-
             current_timepoint_status(current_stop_status, next_timepoint_stop_time, stop_id) do
        %{
          status: current_timepoint_status,
          timepoint_id: next_timepoint_stop_time && next_timepoint_stop_time.timepoint_id,
          fraction_until_timepoint: fraction_until_timepoint
        }
      else
        nil ->
          nil
      end

    %__MODULE__{
      id: id,
      label: label,
      timestamp: timestamp,
      direction_id: direction_id,
      route_id: route_id,
      trip_id: trip_id,
      stop_status: %{
        status: current_stop_status,
        stop_id: stop_id
      },
      timepoint_status: timepoint_status
    }
  end

  @spec fraction_until_timepoint([StopTime.t()], Stop.id()) ::
          {float(), StopTime.t() | nil} | nil
  def fraction_until_timepoint([], _stop_id), do: {0.0, nil}

  def fraction_until_timepoint(stop_times, stop_id) do
    {past_stop_times, future_stop_times} = Enum.split_while(stop_times, &(&1.stop_id != stop_id))

    next_timepoint_stop_time = Enum.find(future_stop_times, &is_a_timepoint?(&1))

    future_count = count_to_timepoint(future_stop_times)

    # past_count needs +1 for the step between the current timepoint and the first of the past stops
    past_count = count_to_timepoint(Enum.reverse(past_stop_times)) + 1

    {
      future_count / (future_count + past_count),
      next_timepoint_stop_time
    }
  end

  @spec count_to_timepoint([StopTime.t()]) :: non_neg_integer()
  defp count_to_timepoint(stop_times) do
    count = Enum.find_index(stop_times, &is_a_timepoint?(&1))

    if is_number(count), do: count, else: length(stop_times)
  end

  @spec is_a_timepoint?(StopTime.t()) :: boolean
  defp is_a_timepoint?(%StopTime{timepoint_id: timepoint_id}), do: timepoint_id != nil

  @spec current_timepoint_status(current_status(), StopTime.t() | nil, Stop.id()) ::
          current_status()
  defp current_timepoint_status(:in_transit_to, _next_timepoint_stop_time, _stop_id),
    do: :in_transit_to

  defp current_timepoint_status(:stopped_at, nil, _stop_id), do: :in_transit_to

  defp current_timepoint_status(:stopped_at, next_timepoint_stop_time, stop_id),
    do: if(next_timepoint_stop_time.stop_id == stop_id, do: :stopped_at, else: :in_transit_to)

  @spec decode_current_status(String.t()) :: current_status()
  defp decode_current_status("IN_TRANSIT_TO"), do: :in_transit_to
  defp decode_current_status("INCOMING_AT"), do: :in_transit_to
  defp decode_current_status("STOPPED_AT"), do: :stopped_at
end
