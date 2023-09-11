defmodule Realtime.Vehicle do
  alias Schedule.Gtfs.Timepoint
  alias Concentrate.{DataDiscrepancy, VehiclePosition}
  alias Schedule.{Block, Route, Trip}
  alias Schedule.Gtfs.{Direction, RoutePattern, Stop}
  alias Schedule.Hastus.Run
  alias Realtime.{BlockWaiver, BlockWaiverStore, Crowding, RouteStatus, TimepointStatus}

  @type stop_status :: %{
          stop_id: Stop.id(),
          stop_name: String.t()
        }

  @type end_of_trip_type :: :another_trip | :swing_off | :pull_back

  @type t :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: Util.Time.timestamp(),
          timestamp_by_source: %{String.t() => Util.Time.timestamp()},
          latitude: float(),
          longitude: float(),
          direction_id: Direction.id(),
          route_id: Route.id() | nil,
          route_pattern_id: RoutePattern.id() | nil,
          trip_id: Trip.id() | nil,
          headsign: String.t() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          bearing: integer() | nil,
          block_id: Block.id() | nil,
          operator_id: String.t() | nil,
          operator_name: String.t() | nil,
          operator_first_name: String.t() | nil,
          operator_last_name: String.t() | nil,
          operator_logon_time: Util.Time.timestamp() | nil,
          overload_offset: integer() | nil,
          run_id: Run.id() | nil,
          previous_vehicle_id: String.t() | nil,
          schedule_adherence_secs: float() | nil,
          incoming_trip_direction_id: Direction.id() | nil,
          is_shuttle: boolean,
          is_overload: boolean(),
          is_off_course: boolean(),
          is_revenue: boolean(),
          layover_departure_time: Util.Time.timestamp() | nil,
          block_is_active: boolean(),
          pull_back_place_name: String.t() | nil,
          sources: MapSet.t(String.t()),
          data_discrepancies: [DataDiscrepancy.t()],
          stop_status: stop_status(),
          timepoint_status: TimepointStatus.timepoint_status() | nil,
          scheduled_location: TimepointStatus.scheduled_location() | nil,
          route_status: RouteStatus.route_status(),
          end_of_trip_type: end_of_trip_type(),
          block_waivers: [BlockWaiver.t()],
          crowding: Crowding.t() | nil
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :timestamp_by_source,
    :latitude,
    :longitude,
    :direction_id,
    :bearing,
    :block_id,
    :operator_id,
    :operator_name,
    :operator_first_name,
    :operator_last_name,
    :operator_logon_time,
    :overload_offset,
    :run_id,
    :is_shuttle,
    :is_overload,
    :is_off_course,
    :is_revenue,
    :block_is_active,
    :sources,
    :stop_status,
    :route_status,
    :end_of_trip_type
  ]

  @derive {Jason.Encoder, except: [:timestamp_by_source]}

  defstruct [
    :id,
    :label,
    :timestamp,
    :timestamp_by_source,
    :latitude,
    :longitude,
    :direction_id,
    :route_id,
    :route_pattern_id,
    :trip_id,
    :headsign,
    :via_variant,
    :bearing,
    :block_id,
    :operator_id,
    :operator_name,
    :operator_first_name,
    :operator_last_name,
    :operator_logon_time,
    :overload_offset,
    :run_id,
    :previous_vehicle_id,
    :schedule_adherence_secs,
    :incoming_trip_direction_id,
    :is_shuttle,
    :is_overload,
    :is_off_course,
    :is_revenue,
    :layover_departure_time,
    :block_is_active,
    :pull_back_place_name,
    :sources,
    :stop_status,
    :timepoint_status,
    :scheduled_location,
    :route_status,
    :end_of_trip_type,
    :crowding,
    block_waivers: [],
    data_discrepancies: []
  ]

  @spec from_vehicle_position(map(), Timepoint.timepoint_names_by_id()) :: t()
  def from_vehicle_position(vehicle_position, timepoint_names_by_id) do
    trip_fn = Application.get_env(:realtime, :trip_fn, &Schedule.trip/1)
    block_fn = Application.get_env(:realtime, :block_fn, &Schedule.block/2)
    now_fn = Application.get_env(:realtime, :now_fn, &Util.Time.now/0)

    block_waivers_for_block_and_service_fn =
      Application.get_env(
        :realtime,
        :block_waivers_for_block_and_service_fn,
        &BlockWaiverStore.block_waivers_for_block_and_service/2
      )

    trip_id = vehicle_position |> VehiclePosition.trip_id() |> Trip.id_sans_overload()
    block_id_with_overload = VehiclePosition.block_id(vehicle_position)
    block_id = Block.id_sans_overload(block_id_with_overload)
    stop_id = VehiclePosition.stop_id(vehicle_position)
    run_id = vehicle_position |> VehiclePosition.run_id() |> ensure_run_id_hyphen()

    trip = trip_fn.(trip_id)
    route_id = VehiclePosition.route_id(vehicle_position) || (trip && trip.route_id)
    direction_id = VehiclePosition.direction_id(vehicle_position) || (trip && trip.direction_id)
    block = trip && trip.schedule_id && block_fn.(trip.schedule_id, block_id)
    headsign = trip && trip.headsign
    route_pattern = trip && trip.route_pattern_id
    via_variant = trip && trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id)
    stop_times_on_trip = (trip && trip.stop_times) || []
    stop_name = stop_name(vehicle_position, stop_id)

    pull_back_place_name =
      block
      |> Block.pull_back_place_id()
      |> (fn id -> Timepoint.pretty_name_for_id(timepoint_names_by_id, id) end).()

    timepoint_status =
      TimepointStatus.timepoint_status(
        stop_times_on_trip,
        stop_id,
        {VehiclePosition.latitude(vehicle_position), VehiclePosition.longitude(vehicle_position)}
      )

    scheduled_location = TimepointStatus.scheduled_location(block, now_fn.())

    # If a vehicle is scheduled to be on another line, don't draw any line.
    scheduled_location =
      if scheduled_location && scheduled_location.route_id == route_id do
        scheduled_location
      else
        nil
      end

    data_discrepancies = VehiclePosition.data_discrepancies(vehicle_position)
    is_shuttle = shuttle?(run_id)
    is_overload = block_id_with_overload != nil && Block.overload?(block_id_with_overload)
    is_off_course = off_course?(is_overload, is_shuttle, data_discrepancies)

    block_waivers =
      if trip && trip.schedule_id,
        do: block_waivers_for_block_and_service_fn.(block_id, trip.schedule_id),
        else: []

    %__MODULE__{
      id: VehiclePosition.id(vehicle_position),
      label: VehiclePosition.label(vehicle_position),
      timestamp: VehiclePosition.last_updated(vehicle_position),
      timestamp_by_source: VehiclePosition.last_updated_by_source(vehicle_position),
      latitude: VehiclePosition.latitude(vehicle_position),
      longitude: VehiclePosition.longitude(vehicle_position),
      direction_id: direction_id,
      route_id: route_id,
      route_pattern_id: route_pattern,
      trip_id: trip_id,
      headsign: headsign,
      via_variant: via_variant,
      bearing: VehiclePosition.bearing(vehicle_position),
      block_id: block_id,
      operator_id: VehiclePosition.operator_id(vehicle_position),
      operator_first_name: VehiclePosition.operator_first_name(vehicle_position),
      operator_last_name: VehiclePosition.operator_last_name(vehicle_position),
      operator_name: VehiclePosition.operator_last_name(vehicle_position),
      operator_logon_time: VehiclePosition.operator_logon_time(vehicle_position),
      overload_offset: VehiclePosition.overload_offset(vehicle_position),
      run_id: run_id,
      previous_vehicle_id: VehiclePosition.previous_vehicle_id(vehicle_position),
      schedule_adherence_secs: VehiclePosition.schedule_adherence_secs(vehicle_position),
      is_shuttle: is_shuttle,
      is_overload: is_overload,
      is_off_course: is_off_course,
      is_revenue: VehiclePosition.revenue(vehicle_position),
      layover_departure_time: VehiclePosition.layover_departure_time(vehicle_position),
      block_is_active: active_block?(is_off_course, block, now_fn.()),
      pull_back_place_name: pull_back_place_name,
      sources: VehiclePosition.sources(vehicle_position),
      data_discrepancies: data_discrepancies,
      stop_status: %{
        stop_id: stop_id,
        stop_name: stop_name
      },
      timepoint_status: timepoint_status,
      scheduled_location: scheduled_location,
      route_status: route_status(stop_id, trip, block),
      end_of_trip_type: end_of_trip_type(block, trip, run_id, stop_id),
      block_waivers: block_waivers,
      crowding: vehicle_position.crowding
    }
  end

  @doc """
  Does this vehicle have a trip assignment from Busloc, but not from Swiftly?
  That is a sign that Swiftly thinks the vehicle is off course, or not on any
  trip for some other reason.
  """
  @spec off_course?(boolean(), boolean(), [DataDiscrepancy.t()] | DataDiscrepancy.t()) ::
          boolean
  def off_course?(true, _is_shuttle, _data_discrepancies), do: false

  def off_course?(_bolck_id, true, _data_discrepancies), do: false

  def off_course?(false, false, data_discrepancies) when is_list(data_discrepancies) do
    trip_id_discrepency =
      Enum.find(data_discrepancies, fn data_discrepancy ->
        data_discrepancy.attribute == :trip_id
      end)

    off_course?(false, false, trip_id_discrepency)
  end

  def off_course?(false, false, nil), do: false

  def off_course?(false, false, %{sources: sources}) do
    case Enum.find(sources, fn source -> source.id == "swiftly" end) do
      %{value: nil} ->
        true

      _ ->
        false
    end
  end

  @spec shuttle?(Run.id() | nil) :: boolean
  def shuttle?(nil), do: false
  def shuttle?("999" <> _), do: true
  def shuttle?(run_id) when is_binary(run_id), do: false

  @doc """
  Check whether the vehicle is off course. If so, check if the assigned block
  was scheduled to end over an hour ago. We give the buffer so that we don't
  tag a bus that is on a detour and late, and should thus still be shown on the
  route ladder.
  """
  @spec active_block?(boolean(), Block.t() | nil, Util.Time.timestamp()) :: boolean()
  def active_block?(_is_off_course, nil, _now), do: false

  def active_block?(false = _is_off_course, _block, _now), do: true

  def active_block?(true = _is_off_course, block, now) do
    one_hour_in_seconds = 1 * 60 * 60
    now_time_of_day = Util.Time.time_of_day_for_timestamp(now, Util.Time.date_of_timestamp(now))

    now_time_of_day - block.end_time <= one_hour_in_seconds
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
    stop = Schedule.stop(stop_id)
    if stop, do: stop.name, else: stop_id
  end

  @spec route_status(Stop.id(), Trip.t() | nil, Block.t() | nil) :: RouteStatus.route_status()
  def route_status(_stop_id, nil, _block) do
    # can't find the trip, won't be able to show it on the ladder, show it incoming instead
    :pulling_out
  end

  def route_status(_stop_id, %Trip{stop_times: []}, _block) do
    :pulling_out
  end

  def route_status(stop_id, trip, block) do
    if stop_id == List.first(trip.stop_times).stop_id do
      first_trip_from_block = block && block |> Block.revenue_trips() |> List.first()
      # hasn't started trip yet
      if first_trip_from_block && trip.id == first_trip_from_block.id do
        # starting the block, pulling out from garage
        :pulling_out
      else
        :laying_over
      end
    else
      :on_route
    end
  end

  @spec end_of_trip_type(
          Block.t() | nil,
          Trip.t() | nil,
          Run.id() | nil,
          Stop.id() | nil
        ) :: end_of_trip_type()
  def end_of_trip_type(block, trip, run_id, _stop_id)
      when block == nil or trip == nil or run_id == nil do
    :another_trip
  end

  def end_of_trip_type(_, %Trip{stop_times: []}, _, _) do
    :another_trip
  end

  def end_of_trip_type(block, trip, run_id, stop_id) do
    # next trip from an operations perspective, not a data perspective
    # if it's waiting to start the next trip, then next_trip is that trip
    # if it's in the middle of a trip, then next_trip is the trip after this one
    # if it's the last trip of the block, then next_trip is :last
    # if something goes wrong and we can't find a next_trip, then :err
    next_trip =
      if first_stop_on_trip?(stop_id, trip) do
        {:trip, trip}
      else
        Block.next_revenue_trip(block, trip.id)
      end

    case next_trip do
      :err ->
        :another_trip

      :last ->
        :pull_back

      {:trip, %Schedule.AsDirected{}} ->
        :another_trip

      {:trip, next_trip} ->
        if next_trip.run_id != nil and next_trip.run_id != run_id do
          :swing_off
        else
          :another_trip
        end
    end
  end

  @spec first_stop_on_trip?(Stop.id(), Trip.t()) :: boolean()
  defp first_stop_on_trip?(stop_id, trip) do
    stop_id == List.first(trip.stop_times).stop_id
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
