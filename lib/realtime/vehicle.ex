defmodule Realtime.Vehicle do
  alias Concentrate.{DataDiscrepancy, VehiclePosition}
  alias Gtfs.{Block, Direction, Route, RoutePattern, Run, Stop, Trip}
  alias Realtime.Headway
  alias Realtime.RouteStatus
  alias Realtime.TimepointStatus

  @type stop_status :: %{
          stop_id: Stop.id(),
          stop_name: String.t()
        }

  @type end_of_trip_type :: :another_trip | :swing_off | :pull_back

  @type t :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: Util.Time.timestamp(),
          latitude: float(),
          longitude: float(),
          direction_id: Direction.id(),
          route_id: Route.id() | nil,
          trip_id: Trip.id() | nil,
          headsign: String.t() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          bearing: integer() | nil,
          block_id: Block.id() | nil,
          operator_id: String.t() | nil,
          operator_name: String.t() | nil,
          run_id: String.t() | nil,
          headway_secs: non_neg_integer() | nil,
          headway_spacing: Headway.headway_spacing() | nil,
          previous_vehicle_id: String.t() | nil,
          schedule_adherence_secs: float() | nil,
          scheduled_headway_secs: float() | nil,
          is_off_course: boolean(),
          layover_departure_time: Util.Time.timestamp() | nil,
          block_is_active: boolean(),
          sources: MapSet.t(String.t()),
          data_discrepancies: [DataDiscrepancy.t()],
          stop_status: stop_status(),
          timepoint_status: TimepointStatus.timepoint_status() | nil,
          scheduled_location: TimepointStatus.scheduled_location() | nil,
          route_status: RouteStatus.route_status(),
          end_of_trip_type: end_of_trip_type()
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :latitude,
    :longitude,
    :direction_id,
    :bearing,
    :block_id,
    :operator_id,
    :operator_name,
    :run_id,
    :headway_spacing,
    :is_off_course,
    :block_is_active,
    :sources,
    :stop_status,
    :route_status,
    :end_of_trip_type
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
    :block_id,
    :operator_id,
    :operator_name,
    :run_id,
    :headway_secs,
    :headway_spacing,
    :previous_vehicle_id,
    :schedule_adherence_secs,
    :scheduled_headway_secs,
    :is_off_course,
    :layover_departure_time,
    :block_is_active,
    :sources,
    :stop_status,
    :timepoint_status,
    :scheduled_location,
    :route_status,
    :end_of_trip_type,
    data_discrepancies: []
  ]

  @spec from_sources(%{atom() => VehiclePosition.t() | nil}) :: t()
  def from_sources(%{busloc: busloc, swiftly: swiftly} = sources) do
    trip_fn = Application.get_env(:realtime, :trip_fn, &Gtfs.trip/1)
    block_fn = Application.get_env(:realtime, :block_fn, &Gtfs.block/2)
    now_fn = Application.get_env(:realtime, :now_fn, &Util.Time.now/0)

    trip_id = swiftly && swiftly.trip_id
    block_id = most_recent([busloc, swiftly], :block_id)
    stop_id = swiftly && swiftly.stop_id
    run_id = ensure_run_id_hyphen(most_recent([busloc, swiftly], :run_id))

    trip = trip_fn.(trip_id)
    route_id = (swiftly && swiftly.route_id) || (trip && trip.route_id)
    direction_id = (swiftly && swiftly.direction_id) || (trip && trip.direction_id)
    block = trip && block_fn.(block_id, trip.service_id)
    headsign = trip && trip.headsign
    via_variant = trip && trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id)
    stop_times_on_trip = (trip && trip.stop_times) || []
    timepoint_status = TimepointStatus.timepoint_status(stop_times_on_trip, stop_id)
    scheduled_location = TimepointStatus.scheduled_location(block, now_fn.())

    # If a vehicle is scheduled to be on another line, don't draw any line.
    scheduled_location =
      if scheduled_location && scheduled_location.route_id == route_id do
        scheduled_location
      else
        nil
      end

    headway_secs = swiftly && swiftly.headway_secs
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

    source_tags =
      sources
      |> Enum.filter(fn {_tag, value} -> value != nil end)
      |> Enum.map(fn {tag, _value} -> tag end)

    data_discrepancies = data_discrepancies(sources)
    is_off_course = off_course?(sources)

    %__MODULE__{
      id: any([busloc, swiftly], :id),
      label: any([busloc, swiftly], :label),
      timestamp: most_recent([busloc, swiftly], :last_updated),
      latitude: most_recent([busloc, swiftly], :latitude),
      longitude: most_recent([busloc, swiftly], :longitude),
      direction_id: direction_id,
      route_id: route_id,
      trip_id: trip_id,
      headsign: headsign,
      via_variant: via_variant,
      bearing: most_recent([busloc, swiftly], :last_updated),
      block_id: block_id,
      operator_id: any([busloc, swiftly], :operator_id),
      operator_name: any([busloc, swiftly], :operator_name),
      run_id: run_id,
      headway_secs: headway_secs,
      headway_spacing: headway_spacing,
      previous_vehicle_id: swiftly && swiftly.previous_vehicle_id,
      schedule_adherence_secs: swiftly && swiftly.schedule_adherence_secs,
      scheduled_headway_secs: swiftly && swiftly.scheduled_headway_secs,
      is_off_course: is_off_course,
      layover_departure_time: swiftly && swiftly.layover_departure_time,
      block_is_active: active_block?(is_off_course, block, now_fn.()),
      sources: MapSet.new(source_tags),
      data_discrepancies: data_discrepancies,
      stop_status: %{
        stop_id: stop_id,
        stop_name: (swiftly && swiftly.stop_name) || stop_name_from_stop(stop_id)
      },
      timepoint_status: timepoint_status,
      scheduled_location: scheduled_location,
      route_status: route_status(stop_id, trip, block),
      end_of_trip_type: end_of_trip_type(block, trip, run_id, stop_id)
    }
  end

  @spec any([VehiclePosition.t() | nil], atom()) :: term() | nil
  def any([], _field), do: nil
  def any([nil | rest], field), do: any(rest, field)

  def any([struct | rest], field) do
    case Map.get(struct, field) do
      nil -> any(rest, field)
      value -> value
    end
  end

  @spec most_recent([VehiclePosition.t() | nil], atom()) :: term() | nil
  def most_recent(structs, field) do
    case Enum.filter(structs, fn struct -> struct != nil end) do
      [] ->
        nil

      structs ->
        structs
        |> Enum.min_by(& &1.last_updated)
        |> Map.get(field)
    end
  end

  @doc """
  Does this vehicle have a trip assignment from Busloc, but not from Swiftly?
  That is a sign that Swiftly thinks the vehicle is off course, or not on any
  trip for some other reason.
  """
  @spec off_course?(%{atom() => term() | nil}) :: boolean()
  def off_course?(%{busloc: busloc, swiftly: swiftly}) do
    busloc != nil and swiftly != nil and busloc.trip_id != nil and swiftly.trip_id == nil
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

  @spec stop_name_from_stop(String.t() | nil) :: String.t() | nil
  defp stop_name_from_stop(stop_id) do
    stop = Gtfs.stop(stop_id)
    if stop, do: stop.name, else: stop_id
  end

  @spec route_status(Stop.id(), Trip.t() | nil, Block.t() | nil) :: RouteStatus.route_status()
  def route_status(_stop_id, nil, _block) do
    # can't find the trip, won't be able to show it on the ladder, show it incoming instead
    :pulling_out
  end

  def route_status(stop_id, trip, block) do
    if stop_id == List.first(trip.stop_times).stop_id do
      # hasn't started trip yet
      if block != nil && trip.id == List.first(block).id do
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
  def end_of_trip_type(block, trip, run_id, stop_id)
      when block == nil or trip == nil or stop_id == nil or run_id == nil do
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
        Block.next_trip(block, trip.id)
      end

    case next_trip do
      :err ->
        :another_trip

      :last ->
        :pull_back

      {:trip, next_trip} ->
        if next_trip.run_id != run_id do
          :swing_off
        else
          :another_trip
        end
    end
  end

  @spec first_stop_on_trip?(Stop.id(), Trip.t()) :: bool()
  defp first_stop_on_trip?(stop_id, trip) do
    stop_id == List.first(trip.stop_times).stop_id
  end

  @spec ensure_run_id_hyphen(Run.id() | nil) :: Run.id() | nil
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

  @spec data_discrepancies(%{atom() => term() | nil}) :: [DataDiscrepancy.t()]
  defp data_discrepancies(%{busloc: busloc, swiftly: swiftly}) do
    if busloc != nil and swiftly != nil and busloc.trip_id != swiftly.trip_id do
      [
        %DataDiscrepancy{
          attribute: "trip_id",
          sources: [
            %{
              id: :busloc,
              value: busloc.trip_id
            },
            %{
              id: :swiftly,
              value: swiftly.trip_id
            }
          ]
        }
      ]
    else
      []
    end
  end
end

defimpl Jason.Encoder, for: MapSet do
  def encode(struct, opts) do
    Jason.Encode.list(Enum.to_list(struct), opts)
  end
end
