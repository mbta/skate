defmodule Realtime.Vehicle do
  alias Concentrate.{DataDiscrepancy, VehiclePosition}
  alias Gtfs.{Block, Direction, Route, RoutePattern, Stop, Trip}
  alias Realtime.Headway
  alias Realtime.TimepointStatus

  @type current_status :: :in_transit_to | :stopped_at
  @type stop_status :: %{
          status: current_status(),
          stop_id: Stop.id(),
          stop_name: String.t()
        }
  @type route_status :: :incoming | :on_route

  @type t :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: integer(),
          latitude: float(),
          longitude: float(),
          direction_id: Direction.id(),
          route_id: Route.id() | nil,
          trip_id: Trip.id() | nil,
          headsign: String.t() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          bearing: integer() | nil,
          stop_sequence: integer() | nil,
          block_id: Block.id() | nil,
          operator_id: String.t() | nil,
          operator_name: String.t() | nil,
          run_id: String.t() | nil,
          headway_secs: non_neg_integer() | nil,
          headway_spacing: Headway.headway_spacing() | nil,
          previous_vehicle_id: String.t() | nil,
          previous_vehicle_schedule_adherence_secs: float() | nil,
          previous_vehicle_schedule_adherence_string: String.t() | nil,
          schedule_adherence_secs: float() | nil,
          schedule_adherence_string: String.t() | nil,
          scheduled_headway_secs: float() | nil,
          is_off_course: boolean(),
          is_laying_over: boolean(),
          layover_departure_time: integer() | nil,
          block_is_active: boolean(),
          sources: MapSet.t(String.t()),
          data_discrepancies: [DataDiscrepancy.t()],
          stop_status: stop_status(),
          timepoint_status: TimepointStatus.timepoint_status() | nil,
          scheduled_location: TimepointStatus.scheduled_location() | nil,
          route_status: route_status()
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :latitude,
    :longitude,
    :direction_id,
    :bearing,
    :stop_sequence,
    :block_id,
    :operator_id,
    :operator_name,
    :run_id,
    :headway_spacing,
    :is_off_course,
    :is_laying_over,
    :block_is_active,
    :sources,
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
    :stop_sequence,
    :block_id,
    :operator_id,
    :operator_name,
    :run_id,
    :headway_secs,
    :headway_spacing,
    :previous_vehicle_id,
    :previous_vehicle_schedule_adherence_secs,
    :previous_vehicle_schedule_adherence_string,
    :schedule_adherence_secs,
    :schedule_adherence_string,
    :scheduled_headway_secs,
    :is_off_course,
    :is_laying_over,
    :layover_departure_time,
    :block_is_active,
    :sources,
    :stop_status,
    :timepoint_status,
    :scheduled_location,
    :route_status,
    data_discrepancies: []
  ]

  @spec from_vehicle_position(map()) :: t()
  def from_vehicle_position(vehicle_position) do
    trip_fn = Application.get_env(:realtime, :trip_fn, &Gtfs.trip/1)
    block_fn = Application.get_env(:realtime, :block_fn, &Gtfs.block/2)
    now_fn = Application.get_env(:realtime, :now_fn, &Util.Time.now/0)

    trip_id = VehiclePosition.trip_id(vehicle_position)
    block_id = VehiclePosition.block_id(vehicle_position)
    stop_id = VehiclePosition.stop_id(vehicle_position)
    current_stop_status = decode_current_status(VehiclePosition.status(vehicle_position))

    trip = trip_fn.(trip_id)
    route_id = VehiclePosition.route_id(vehicle_position) || (trip && trip.route_id)
    direction_id = VehiclePosition.direction_id(vehicle_position) || (trip && trip.direction_id)
    block = trip && block_fn.(block_id, trip.service_id)
    headsign = trip && trip.headsign
    via_variant = trip && trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id)
    stop_times_on_trip = (trip && trip.stop_times) || []
    stop_name = stop_name(vehicle_position, stop_id)
    timepoint_status = TimepointStatus.timepoint_status(stop_times_on_trip, stop_id)
    scheduled_location = TimepointStatus.scheduled_location(block, now_fn.())

    # If a vehicle is scheduled to be on another line, don't draw any line.
    scheduled_location =
      if scheduled_location && scheduled_location.route_id == route_id do
        scheduled_location
      else
        nil
      end

    headway_secs = VehiclePosition.headway_secs(vehicle_position)
    origin_stop_id = List.first(stop_times_on_trip) && List.first(stop_times_on_trip).stop_id

    date_time_now_fn = Application.get_env(:realtime, :date_time_now_fn, &Timex.now/0)

    headway_spacing =
      if headway_secs == nil do
        nil
      else
        case Headway.current_expected_headway_seconds(
               route_id,
               direction_id,
               origin_stop_id,
               date_time_now_fn.()
             ) do
          nil -> nil
          expected_seconds -> Headway.current_headway_spacing(expected_seconds, headway_secs)
        end
      end

    data_discrepancies = VehiclePosition.data_discrepancies(vehicle_position)
    is_off_course = off_course?(data_discrepancies)

    %__MODULE__{
      id: VehiclePosition.id(vehicle_position),
      label: VehiclePosition.label(vehicle_position),
      timestamp: VehiclePosition.last_updated(vehicle_position),
      latitude: VehiclePosition.latitude(vehicle_position),
      longitude: VehiclePosition.longitude(vehicle_position),
      direction_id: direction_id,
      route_id: route_id,
      trip_id: trip_id,
      headsign: headsign,
      via_variant: via_variant,
      bearing: VehiclePosition.bearing(vehicle_position),
      stop_sequence: VehiclePosition.stop_sequence(vehicle_position),
      block_id: block_id,
      operator_id: VehiclePosition.operator_id(vehicle_position),
      operator_name: VehiclePosition.operator_name(vehicle_position),
      run_id: vehicle_position |> VehiclePosition.run_id() |> ensure_run_id_hyphen(),
      headway_secs: headway_secs,
      headway_spacing: headway_spacing,
      previous_vehicle_id: VehiclePosition.previous_vehicle_id(vehicle_position),
      previous_vehicle_schedule_adherence_secs:
        VehiclePosition.previous_vehicle_schedule_adherence_secs(vehicle_position),
      previous_vehicle_schedule_adherence_string:
        VehiclePosition.previous_vehicle_schedule_adherence_string(vehicle_position),
      schedule_adherence_secs: VehiclePosition.schedule_adherence_secs(vehicle_position),
      schedule_adherence_string: VehiclePosition.schedule_adherence_string(vehicle_position),
      scheduled_headway_secs: VehiclePosition.scheduled_headway_secs(vehicle_position),
      is_off_course: is_off_course,
      is_laying_over: VehiclePosition.is_laying_over(vehicle_position),
      layover_departure_time: VehiclePosition.layover_departure_time(vehicle_position),
      block_is_active: active_block?(is_off_course, block, now_fn.()),
      sources: VehiclePosition.sources(vehicle_position),
      data_discrepancies: data_discrepancies,
      stop_status: %{
        status: current_stop_status,
        stop_id: stop_id,
        stop_name: stop_name
      },
      timepoint_status: timepoint_status,
      scheduled_location: scheduled_location,
      route_status: route_status(current_stop_status, stop_id, trip)
    }
  end

  @doc """
  Does this vehicle have a trip assignment from Busloc, but not from Swiftly?
  That is a sign that Swiftly thinks the vehicle is off course, or not on any
  trip for some other reason.
  """
  @spec off_course?([DataDiscrepancy.t()] | DataDiscrepancy.t()) :: boolean
  def off_course?(data_discrepancies) when is_list(data_discrepancies) do
    trip_id_discrepency =
      Enum.find(data_discrepancies, fn data_discrepancy ->
        data_discrepancy.attribute == :trip_id
      end)

    off_course?(trip_id_discrepency)
  end

  def off_course?(nil), do: false

  def off_course?(%{sources: sources}) do
    case Enum.find(sources, fn source -> source.id == "swiftly" end) do
      %{value: nil} ->
        true

      _ ->
        false
    end
  end

  def shuttle?(%__MODULE__{run_id: "999" <> _}), do: true
  def shuttle?(%__MODULE__{}), do: false

  @doc """
  Check whether the vehicle is off course. If so, check if the assigned block
  was scheduled to end over an hour ago. We give the buffer so that we don't
  tag a bus that is on a detour and late, and should thus still be shown on the
  route ladder.
  """
  @spec active_block?(boolean(), Block.t() | nil, Util.Time.timestamp()) :: boolean()
  def active_block?(_is_off_course, nil, _now), do: false

  def active_block?(_is_off_course = false, _block, _now), do: true

  def active_block?(_is_off_course = true, block, now) do
    one_hour_in_seconds = 1 * 60 * 60
    now_time_of_day = Util.Time.time_of_day_for_timestamp(now, Util.Time.date_of_timestamp(now))

    now_time_of_day - Block.end_time(block) <= one_hour_in_seconds
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

  defp ensure_run_id_hyphen(nil) do
    nil
  end

  defp ensure_run_id_hyphen(run_id) do
    case String.at(run_id, 3) do
      "-" ->
        run_id

      _ ->
        {prefix, suffix} = String.split_at(run_id, 3)
        prefix <> "-" <> suffix
    end
  end
end

defimpl Jason.Encoder, for: MapSet do
  def encode(struct, opts) do
    Jason.Encode.list(Enum.to_list(struct), opts)
  end
end
