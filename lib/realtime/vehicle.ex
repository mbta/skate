defmodule Realtime.Vehicle do
  alias Concentrate.{DataDiscrepancy, TripUpdate, VehiclePosition}
  alias Gtfs.{Direction, Route, RoutePattern, Stop, StopTime, Trip}

  @type current_status :: :in_transit_to | :stopped_at
  @type stop_status :: %{
          status: current_status(),
          stop_id: Stop.id(),
          stop_name: String.t()
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
  @type route_status :: :incoming | :on_route

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
          headsign: String.t() | nil,
          headway_secs: float() | nil,
          previous_vehicle_id: String.t() | nil,
          previous_vehicle_schedule_adherence_secs: float() | nil,
          previous_vehicle_schedule_adherence_string: String.t() | nil,
          route_id: String.t() | nil,
          schedule_adherence_secs: float() | nil,
          schedule_adherence_string: String.t() | nil,
          scheduled_headway_secs: float() | nil,
          sources: MapSet.t(String.t()),
          data_discrepancies: [DataDiscrepancy.t()],
          stop_status: stop_status(),
          timepoint_status: timepoint_status() | nil,
          scheduled_timepoint_status: timepoint_status() | nil,
          route_status: route_status()
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
    :sources,
    :data_discrepancies,
    :stop_status,
    :route_status
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
    :headsign,
    :headway_secs,
    :previous_vehicle_id,
    :previous_vehicle_schedule_adherence_secs,
    :previous_vehicle_schedule_adherence_string,
    :route_id,
    :schedule_adherence_secs,
    :schedule_adherence_string,
    :scheduled_headway_secs,
    :sources,
    :data_discrepancies,
    :stop_status,
    :timepoint_status,
    :scheduled_timepoint_status,
    :route_status
  ]

  @spec from_vehicle_position_and_trip_update(map() | nil, map() | nil) :: t()
  def from_vehicle_position_and_trip_update(nil, _trip_update) do
    nil
  end

  def from_vehicle_position_and_trip_update(vehicle_position, trip_update) do
    trip_fn = Application.get_env(:realtime, :trip_fn, &Gtfs.trip/1)

    trip_id = VehiclePosition.trip_id(vehicle_position)
    trip = trip_fn.(trip_id)
    headsign = trip && trip.headsign
    via_variant = trip && trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id)
    stop_times_on_trip = (trip && trip.stop_times) || []

    current_stop_status = decode_current_status(VehiclePosition.status(vehicle_position))

    stop_id = VehiclePosition.stop_id(vehicle_position)

    stop_name = stop_name(vehicle_position, stop_id)

    timepoint_status = timepoint_status(stop_times_on_trip, stop_id)

    %__MODULE__{
      id: VehiclePosition.id(vehicle_position),
      label: VehiclePosition.label(vehicle_position),
      timestamp: VehiclePosition.last_updated(vehicle_position),
      latitude: VehiclePosition.latitude(vehicle_position),
      longitude: VehiclePosition.longitude(vehicle_position),
      direction_id:
        VehiclePosition.direction_id(vehicle_position) ||
          (trip_update && TripUpdate.direction_id(trip_update)),
      route_id:
        VehiclePosition.route_id(vehicle_position) ||
          (trip_update && TripUpdate.route_id(trip_update)),
      trip_id: trip_id,
      headsign: headsign,
      via_variant: via_variant,
      bearing: VehiclePosition.bearing(vehicle_position),
      speed: VehiclePosition.speed(vehicle_position),
      stop_sequence: VehiclePosition.stop_sequence(vehicle_position),
      block_id: VehiclePosition.block_id(vehicle_position),
      operator_id: VehiclePosition.operator_id(vehicle_position),
      operator_name: VehiclePosition.operator_name(vehicle_position),
      run_id: VehiclePosition.run_id(vehicle_position),
      headway_secs: VehiclePosition.headway_secs(vehicle_position),
      previous_vehicle_id: VehiclePosition.previous_vehicle_id(vehicle_position),
      previous_vehicle_schedule_adherence_secs:
        VehiclePosition.previous_vehicle_schedule_adherence_secs(vehicle_position),
      previous_vehicle_schedule_adherence_string:
        VehiclePosition.previous_vehicle_schedule_adherence_string(vehicle_position),
      schedule_adherence_secs: VehiclePosition.schedule_adherence_secs(vehicle_position),
      schedule_adherence_string: VehiclePosition.schedule_adherence_string(vehicle_position),
      scheduled_headway_secs: VehiclePosition.scheduled_headway_secs(vehicle_position),
      sources: VehiclePosition.sources(vehicle_position),
      data_discrepancies: VehiclePosition.data_discrepancies(vehicle_position),
      stop_status: %{
        status: current_stop_status,
        stop_id: stop_id,
        stop_name: stop_name
      },
      timepoint_status: timepoint_status,
      scheduled_timepoint_status:
        scheduled_timepoint_status(
          stop_times_on_trip,
          Util.Time.now()
        ),
      route_status: route_status(current_stop_status, stop_id, trip)
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

  @spec scheduled_timepoint_status([StopTime.t()], Util.Time.timestamp()) ::
          timepoint_status() | nil
  def scheduled_timepoint_status([], _now) do
    nil
  end

  def scheduled_timepoint_status(stop_times_on_trip, now) do
    trip_start = List.first(stop_times_on_trip).time
    now_time_of_day = Util.Time.nearest_time_of_day_for_timestamp(now, trip_start)
    timepoints = Enum.filter(stop_times_on_trip, &is_a_timepoint?/1)

    case Realtime.Helpers.find_and_previous(timepoints, fn timepoint ->
           timepoint.time >= now_time_of_day
         end) do
      nil ->
        nil

      {previous_timepoint, next_timepoint} ->
        %{
          timepoint_id: next_timepoint.timepoint_id,
          fraction_until_timepoint:
            (next_timepoint.time - now_time_of_day) /
              (next_timepoint.time - previous_timepoint.time)
        }
    end
  end

  @spec stop_name(map() | nil, String.t() | nil) :: String.t() | nil
  defp stop_name(vehicle_position, stop_id) do
    vp_stop_name = VehiclePosition.stop_name(vehicle_position)

    if vp_stop_name != nil do
      vp_stop_name
    else
      stop_name_from_stop(stop_id)
    end
  end

  @spec stop_name_from_stop(String.t() | nil) :: String.t() | nil
  defp stop_name_from_stop(stop_id) do
    stop = Gtfs.stop(stop_id)
    if stop, do: stop.name, else: stop_id
  end

  @spec count_to_timepoint([StopTime.t()]) :: non_neg_integer()
  defp count_to_timepoint(stop_times) do
    count = Enum.find_index(stop_times, &is_a_timepoint?(&1))

    if is_number(count), do: count, else: length(stop_times)
  end

  @spec is_a_timepoint?(StopTime.t()) :: boolean
  defp is_a_timepoint?(%StopTime{timepoint_id: timepoint_id}), do: timepoint_id != nil

  @spec decode_current_status(atom()) :: current_status()
  defp decode_current_status(:IN_TRANSIT_TO), do: :in_transit_to
  defp decode_current_status(:INCOMING_AT), do: :in_transit_to
  defp decode_current_status(:STOPPED_AT), do: :stopped_at

  @spec route_status(current_status(), Stop.id(), Trip.t() | nil) :: route_status()
  def route_status(_status, _stop_id, nil), do: :incoming

  def route_status(:stopped_at, _stop_id, _trip), do: :on_route

  def route_status(:in_transit_to, stop_id, %Trip{stop_times: [first_stop_time | _rest]}) do
    if first_stop_time.stop_id == stop_id do
      :incoming
    else
      :on_route
    end
  end
end

defimpl Jason.Encoder, for: MapSet do
  def encode(struct, opts) do
    Jason.Encode.list(Enum.to_list(struct), opts)
  end
end
