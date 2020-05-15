defmodule Concentrate.Parser.GTFSRealtimeEnhanced do
  @moduledoc """
  Parser for GTFS-RT enhanced JSON files.
  """
  @behaviour Concentrate.Parser
  require Logger
  alias Concentrate.{StopTimeUpdate, TripUpdate, VehiclePosition}

  @impl Concentrate.Parser
  def parse(binary) when is_binary(binary) do
    binary
    |> Jason.decode!(strings: :copy)
    |> decode_entities()
  end

  @spec decode_entities(map()) :: [TripUpdate.t() | StopTimeUpdate.t() | VehiclePosition.t()]
  defp decode_entities(%{"entity" => entities}),
    do: Enum.flat_map(entities, &decode_feed_entity(&1))

  defp decode_feed_entity(%{"trip_update" => %{} = trip_update}),
    do: decode_trip_update(trip_update)

  defp decode_feed_entity(%{"vehicle" => %{} = vehicle}), do: decode_vehicle(vehicle)

  defp decode_feed_entity(_), do: []

  @spec decode_trip_update(map()) :: [TripUpdate.t() | StopTimeUpdate.t()]
  def decode_trip_update(trip_update) do
    tu = decode_trip_descriptor(Map.get(trip_update, "trip"))

    stop_updates =
      for stu <- Map.get(trip_update, "stop_time_update") do
        {arrival_time, arrival_uncertainty} = time_from_event(Map.get(stu, "arrival"))
        {departure_time, departure_uncertainty} = time_from_event(Map.get(stu, "departure"))

        StopTimeUpdate.new(
          trip_id:
            if(descriptor = Map.get(trip_update, "trip"), do: Map.get(descriptor, "trip_id")),
          stop_id: Map.get(stu, "stop_id"),
          stop_sequence: Map.get(stu, "stop_sequence"),
          schedule_relationship: schedule_relationship(Map.get(stu, "schedule_relationship")),
          arrival_time: arrival_time,
          departure_time: departure_time,
          uncertainty: arrival_uncertainty || departure_uncertainty,
          status: Map.get(stu, "boarding_status"),
          platform_id: Map.get(stu, "platform_id"),
          remark: Map.get(stu, "remark")
        )
      end

    tu ++ stop_updates
  end

  @spec decode_vehicle(map()) :: [TripUpdate.t() | VehiclePosition.t()] | []
  def decode_vehicle(vp) do
    operator = Map.get(vp, "operator", %{})
    position = Map.get(vp, "position", %{})
    vehicle = Map.get(vp, "vehicle", %{})

    case decode_trip_descriptor(Map.get(vp, "trip")) do
      [trip] ->
        [
          trip,
          VehiclePosition.new(
            id: Map.get(vehicle, "id"),
            trip_id: TripUpdate.trip_id(trip),
            stop_id: Map.get(vp, "stop_id"),
            label: Map.get(vehicle, "label"),
            license_plate: Map.get(vehicle, "license_plate"),
            latitude: Map.get(position, "latitude"),
            longitude: Map.get(position, "longitude"),
            bearing: Map.get(position, "bearing"),
            speed: Map.get(position, "speed"),
            odometer: Map.get(position, "odometer"),
            current_status: current_status(Map.get(vp, "current_status")),
            stop_sequence: Map.get(vp, "current_stop_sequence"),
            last_updated: Map.get(vp, "timestamp"),
            block_id: Map.get(vp, "block_id"),
            run_id: Map.get(vp, "run_id"),
            operator_id: Map.get(operator, "id"),
            operator_name: Map.get(operator, "name"),
            operator_logon_time: Map.get(operator, "logon_time"),
            sources: MapSet.new(["busloc"]),
            data_discrepancies: []
          )
        ]

      [] ->
        []
    end
  end

  @spec decode_trip_descriptor(map() | nil) :: [TripUpdate.t()] | []
  defp decode_trip_descriptor(nil) do
    []
  end

  defp decode_trip_descriptor(trip) do
    [
      TripUpdate.new(
        trip_id: Map.get(trip, "trip_id"),
        route_id: Map.get(trip, "route_id"),
        direction_id: Map.get(trip, "direction_id"),
        start_date: date(Map.get(trip, "start_date")),
        start_time: Map.get(trip, "start_time"),
        schedule_relationship: schedule_relationship(Map.get(trip, "schedule_relationship"))
      )
    ]
  end

  @spec date(String.t() | nil) :: :calendar.date() | nil
  def date(nil) do
    nil
  end

  def date(<<year_str::binary-4, month_str::binary-2, day_str::binary-2>>) do
    {
      String.to_integer(year_str),
      String.to_integer(month_str),
      String.to_integer(day_str)
    }
  end

  def date(date) when is_binary(date) do
    {:ok, date} = Date.from_iso8601(date)
    Date.to_erl(date)
  end

  defp time_from_event(nil), do: {nil, nil}
  defp time_from_event(%{"time" => time} = map), do: {time, Map.get(map, "uncertainty", nil)}

  @spec schedule_relationship(String.t() | nil) :: atom()
  defp schedule_relationship(nil), do: :SCHEDULED

  for relationship <- ~w(SCHEDULED ADDED UNSCHEDULED CANCELED SKIPPED NO_DATA)a do
    defp schedule_relationship(unquote(Atom.to_string(relationship))), do: unquote(relationship)
  end

  @spec current_status(String.t() | nil) :: atom()
  # default
  defp current_status(nil), do: :IN_TRANSIT_TO

  for status <- ~w(INCOMING_AT STOPPED_AT IN_TRANSIT_TO)a do
    defp current_status(unquote(Atom.to_string(status))), do: unquote(status)
  end
end
