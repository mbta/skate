defmodule Concentrate.Parser.GTFSRealtime do
  @moduledoc """
  Parser for [GTFS-Realtime](https://developers.google.com/transit/gtfs-realtime/) ProtoBuf files.
  """
  @behaviour Concentrate.Parser
  alias Concentrate.Parser.Helpers

  alias Concentrate.{Alert, Alert.InformedEntity, StopTimeUpdate, TripUpdate, VehiclePosition}
  @impl Concentrate.Parser
  def parse(binary, opts) when is_binary(binary) and is_list(opts) do
    options = Helpers.parse_options(opts)
    message = :gtfs_realtime_proto.decode_msg(binary, :FeedMessage, [])

    message.entity
    |> Enum.flat_map(&decode_feed_entity(&1, options))
    |> Helpers.drop_fields(options.drop_fields)
  end

  def decode_feed_entity(entity, options) do
    vp = decode_vehicle(Map.get(entity, :vehicle), options)
    stop_updates = decode_trip_update(Map.get(entity, :trip_update), options)
    alerts = decode_alert(entity)
    List.flatten([alerts, vp, stop_updates])
  end

  def decode_vehicle(nil, _opts) do
    []
  end

  def decode_vehicle(vp, options) do
    tu = decode_trip_descriptor(vp)
    decode_vehicle_position(tu, vp, options)
  end

  defp decode_vehicle_position(tu, vp, options) do
    if tu == [] or valid_route_id?(options, TripUpdate.route_id(List.first(tu))) do
      trip_id =
        case vp do
          %{trip: %{trip_id: id}} -> id
          _ -> nil
        end

      vehicle = vp.vehicle
      position = vp.position

      tu ++
        [
          VehiclePosition.new(
            id: Map.get(vehicle, :id),
            trip_id: trip_id,
            stop_id: Map.get(vp, :stop_id),
            label: Map.get(vehicle, :label),
            license_plate: Map.get(vehicle, :license_plate),
            latitude: Map.get(position, :latitude),
            longitude: Map.get(position, :longitude),
            bearing: Map.get(position, :bearing),
            speed: Map.get(position, :speed),
            odometer: Map.get(position, :odometer),
            status: Map.get(vp, :current_status),
            stop_sequence: Map.get(vp, :current_stop_sequence),
            last_updated: Map.get(vp, :timestamp)
          )
        ]
    else
      []
    end
  end

  defp valid_route_id?(%{routes: {:ok, route_ids}}, route_id) do
    route_id in route_ids
  end

  defp valid_route_id?(%{excluded_routes: {:ok, route_ids}}, route_id) do
    not (route_id in route_ids)
  end

  defp valid_route_id?(_, _) do
    true
  end

  def decode_trip_update(nil, _options) do
    []
  end

  def decode_trip_update(trip_update, options) do
    tu = decode_trip_descriptor(trip_update)
    decode_stop_updates(tu, trip_update, options)
  end

  defp decode_stop_updates(tu, %{stop_time_update: [update | _] = updates} = trip_update, options) do
    max_time = options.max_time

    {arrival_time, _} = time_from_event(Map.get(update, :arrival))
    {departure_time, _} = time_from_event(Map.get(update, :departure))

    cond do
      tu != [] and not valid_route_id?(options, TripUpdate.route_id(List.first(tu))) ->
        []

      not times_less_than_max?(arrival_time, departure_time, max_time) ->
        []

      true ->
        stop_updates =
          for stu <- updates do
            {arrival_time, arrival_uncertainty} = time_from_event(Map.get(stu, :arrival))
            {departure_time, departure_uncertainty} = time_from_event(Map.get(stu, :departure))

            StopTimeUpdate.new(
              trip_id: Map.get(trip_update.trip, :trip_id),
              stop_id: Map.get(stu, :stop_id),
              stop_sequence: Map.get(stu, :stop_sequence),
              schedule_relationship: Map.get(stu, :schedule_relationship, :SCHEDULED),
              arrival_time: arrival_time,
              departure_time: departure_time,
              uncertainty: arrival_uncertainty || departure_uncertainty
            )
          end

        tu ++ stop_updates
    end
  end

  defp decode_stop_updates(tu, %{stop_time_update: []}, options) do
    if tu != [] and not valid_route_id?(options, TripUpdate.route_id(List.first(tu))) do
      []
    else
      tu
    end
  end

  defp times_less_than_max?(_, _, :infinity), do: true
  defp times_less_than_max?(nil, nil, _), do: true
  defp times_less_than_max?(time, nil, max), do: time <= max
  defp times_less_than_max?(_, time, max), do: time <= max

  defp decode_trip_descriptor(%{trip: trip}) do
    [
      TripUpdate.new(
        trip_id: Map.get(trip, :trip_id),
        route_id: Map.get(trip, :route_id),
        direction_id: Map.get(trip, :direction_id),
        start_date: date(Map.get(trip, :start_date)),
        start_time: Map.get(trip, :start_time),
        schedule_relationship: Map.get(trip, :schedule_relationship, :SCHEDULED)
      )
    ]
  end

  defp decode_trip_descriptor(_) do
    []
  end

  defp date(nil) do
    nil
  end

  defp date(<<year_str::binary-4, month_str::binary-2, day_str::binary-2>>) do
    {
      String.to_integer(year_str),
      String.to_integer(month_str),
      String.to_integer(day_str)
    }
  end

  defp decode_alert(%{id: id, alert: %{} = alert}) do
    [
      Alert.new(
        id: id,
        effect: alert.effect,
        active_period: Enum.map(alert.active_period, &decode_active_period/1),
        informed_entity: Enum.map(alert.informed_entity, &decode_informed_entity/1)
      )
    ]
  end

  defp decode_alert(_) do
    []
  end

  defp decode_active_period(period) do
    start = Map.get(period, :start, 0)
    # 2 ^ 32 - 1, max value for the field
    stop = Map.get(period, :stop, 4_294_967_295)
    {start, stop}
  end

  defp decode_informed_entity(entity) do
    trip = Map.get(entity, :trip, %{})

    InformedEntity.new(
      trip_id: Map.get(trip, :trip_id),
      route_id: Map.get(entity, :route_id),
      direction_id: Map.get(trip, :direction_id),
      route_type: Map.get(entity, :route_type),
      stop_id: Map.get(entity, :stop_id)
    )
  end

  defp time_from_event(%{time: time} = map), do: {time, Map.get(map, :uncertainty, nil)}
  defp time_from_event(_), do: {nil, nil}
end
