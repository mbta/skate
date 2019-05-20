defmodule Realtime.Vehicle do
  alias Gtfs.{Direction, Route, RoutePattern, Stop, StopTime, Trip}

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
            timepoint_id: StopTime.timepoint_id(),
            fraction_until_timepoint: float()
          }

  @type t :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: integer(),
          latitude: float(),
          longitude: float(),
          direction_id: Direction.id(),
          route_id: Route.id(),
          trip_id: Trip.id(),
          headsign: String.t() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          stop_status: stop_status(),
          timepoint_status: timepoint_status() | nil
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :latitude,
    :longitude,
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
    :latitude,
    :longitude,
    :direction_id,
    :route_id,
    :trip_id,
    :headsign,
    :via_variant,
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
    trip_fn = Application.get_env(:realtime, :trip_fn, &Gtfs.trip/1)

    trip_id = json["vehicle"]["trip"]["trip_id"]
    current_stop_status = decode_current_status(json["vehicle"]["current_status"])
    stop_id = json["vehicle"]["stop_id"]

    trip = trip_fn.(trip_id)
    headsign = trip && trip.headsign
    via_variant = trip && trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id)
    stop_times_on_trip = (trip && trip.stop_times) || []

    timepoint_status = timepoint_status(stop_times_on_trip, stop_id)

    %__MODULE__{
      id: json["id"],
      label: json["vehicle"]["vehicle"]["label"],
      timestamp: json["vehicle"]["timestamp"],
      latitude: json["vehicle"]["position"]["latitude"],
      longitude: json["vehicle"]["position"]["longitude"],
      direction_id: json["vehicle"]["trip"]["direction_id"],
      route_id: json["vehicle"]["trip"]["route_id"],
      trip_id: trip_id,
      headsign: headsign,
      via_variant: via_variant,
      stop_status: %{
        status: current_stop_status,
        stop_id: stop_id
      },
      timepoint_status: timepoint_status
    }
  end

  @spec timepoint_status([StopTime.t()], Stop.id()) :: timepoint_status() | nil
  def timepoint_status(stop_times, stop_id) do
    {past_stop_times, future_stop_times} = Enum.split_while(stop_times, &(&1.stop_id != stop_id))

    case Enum.find(future_stop_times, &is_a_timepoint?(&1)) do
      %StopTime{timepoint_id: next_timepoint_id} ->
        # past_count needs +1 for the step between the current timepoint and the first of the past stops
        past_count = count_to_timepoint(Enum.reverse(past_stop_times)) + 1
        future_count = count_to_timepoint(future_stop_times)

        %{
          timepoint_id: next_timepoint_id,
          fraction_until_timepoint: future_count / (future_count + past_count)
        }

      nil ->
        nil
    end
  end

  @spec count_to_timepoint([StopTime.t()]) :: non_neg_integer()
  defp count_to_timepoint(stop_times) do
    count = Enum.find_index(stop_times, &is_a_timepoint?(&1))

    if is_number(count), do: count, else: length(stop_times)
  end

  @spec is_a_timepoint?(StopTime.t()) :: boolean
  defp is_a_timepoint?(%StopTime{timepoint_id: timepoint_id}), do: timepoint_id != nil

  @spec decode_current_status(String.t()) :: current_status()
  defp decode_current_status("IN_TRANSIT_TO"), do: :in_transit_to
  defp decode_current_status("INCOMING_AT"), do: :in_transit_to
  defp decode_current_status("STOPPED_AT"), do: :stopped_at
end
