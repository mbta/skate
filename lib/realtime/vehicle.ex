defmodule Realtime.Vehicle do
  alias Concentrate.{TripUpdate, VehiclePosition}
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
          bearing: integer() | nil,
          speed: integer() | nil,
          stop_sequence: integer() | nil,
          block_id: String.t() | nil,
          operator_id: String.t() | nil,
          operator_name: String.t() | nil,
          run_id: String.t() | nil,
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
    :bearing,
    :speed,
    :stop_sequence,
    :block_id,
    :operator_id,
    :operator_name,
    :run_id,
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
    :bearing,
    :speed,
    :stop_sequence,
    :block_id,
    :operator_id,
    :operator_name,
    :run_id,
    :stop_status,
    :timepoint_status
  ]

  @spec from_vehicle_position_and_trip_update(map() | nil, map() | nil) :: t()
  def from_vehicle_position_and_trip_update(nil, _trip_update) do
    nil
  end

  def from_vehicle_position_and_trip_update(_vehicle_position, nil) do
    nil
  end

  def from_vehicle_position_and_trip_update(
        %VehiclePosition{
          id: id,
          trip_id: trip_id,
          stop_id: stop_id,
          label: label,
          latitude: latitude,
          longitude: longitude,
          bearing: bearing,
          speed: speed,
          stop_sequence: stop_sequence,
          block_id: block_id,
          operator_id: operator_id,
          operator_name: operator_name,
          run_id: run_id,
          last_updated: last_updated,
          status: status
        },
        "vehicle": { "id": "y0507", "label": "0507" }
      }
    }
    trip_fn = Application.get_env(:realtime, :trip_fn, &Gtfs.trip/1)

    current_stop_status = decode_current_status(status)

    trip = trip_fn.(trip_id)
    headsign = trip && trip.headsign
    via_variant = trip && trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id)
    stop_times_on_trip = (trip && trip.stop_times) || []

    stop_times_on_trip =
      try do
        stop_times_on_trip_fn.(trip_id)
      catch
        # Handle Gtfs server timeouts gracefully
        :exit, _ ->
          []
      end

    timepoint_status = timepoint_status(stop_times_on_trip, stop_id)

    %__MODULE__{
      id: id,
      label: label,
      timestamp: last_updated,
      latitude: latitude,
      longitude: longitude,
      direction_id: direction_id,
      route_id: route_id,
      trip_id: trip_id,
      headsign: headsign,
      via_variant: via_variant,
      bearing: bearing,
      speed: speed,
      stop_sequence: stop_sequence,
      block_id: block_id,
      operator_id: operator_id,
      operator_name: operator_name,
      run_id: run_id,
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

  @spec decode_current_status(String.t() | atom()) :: current_status()
  defp decode_current_status("IN_TRANSIT_TO"), do: :in_transit_to
  defp decode_current_status(:IN_TRANSIT_TO), do: :in_transit_to
  defp decode_current_status("INCOMING_AT"), do: :in_transit_to
  defp decode_current_status(:INCOMING_AT), do: :in_transit_to
  defp decode_current_status("STOPPED_AT"), do: :stopped_at
  defp decode_current_status(:STOPPED_AT), do: :stopped_at
end
