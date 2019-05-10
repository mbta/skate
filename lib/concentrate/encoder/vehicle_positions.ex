defmodule Concentrate.Encoder.VehiclePositions do
  @moduledoc """
  Encodes a list of parsed data into a VehiclePositions.pb file.
  """
  @behaviour Concentrate.Encoder
  alias Concentrate.{TripUpdate, VehiclePosition}
  import Concentrate.Encoder.GTFSRealtimeHelpers

  @impl Concentrate.Encoder
  def encode_groups(groups) when is_list(groups) do
    message = %{
      header: feed_header(),
      entity: Enum.flat_map(groups, &build_entity/1)
    }

    :gtfs_realtime_proto.encode_msg(message, :FeedMessage)
  end

  def feed_entity(list) do
    list
    |> group
    |> Enum.flat_map(&build_entity/1)
  end

  def build_entity({%TripUpdate{} = update, vps, _stus}) do
    trip = trip_descriptor(update)

    for vp <- vps do
      %{
        id: entity_id(vp),
        vehicle: build_vehicle(vp, trip)
      }
    end
  end

  def build_entity({nil, vps, _stus}) do
    # vehicles without a trip
    for vp <- vps do
      trip =
        if trip_id = VehiclePosition.trip_id(vp) do
          %{
            trip_id: trip_id,
            schedule_relationship: :UNSCHEDULED
          }
        end

      %{
        id: entity_id(vp),
        vehicle: build_vehicle(vp, trip)
      }
    end
  end

  defp build_vehicle(%VehiclePosition{} = vp, trip) do
    descriptor =
      drop_nil_values(%{
        id: VehiclePosition.id(vp),
        label: VehiclePosition.label(vp),
        license_plate: VehiclePosition.license_plate(vp)
      })

    position =
      drop_nil_values(%{
        latitude: VehiclePosition.latitude(vp),
        longitude: VehiclePosition.longitude(vp),
        bearing: VehiclePosition.bearing(vp),
        speed: VehiclePosition.speed(vp)
      })

    drop_nil_values(%{
      trip: trip,
      vehicle: descriptor,
      position: position,
      stop_id: VehiclePosition.stop_id(vp),
      current_stop_sequence: VehiclePosition.stop_sequence(vp),
      current_status: VehiclePosition.status(vp),
      timestamp: VehiclePosition.last_updated(vp)
    })
  end

  defp entity_id(vp) do
    VehiclePosition.id(vp) || VehiclePosition.trip_id(vp) ||
      Integer.to_string(:erlang.unique_integer())
  end

  defp trip_descriptor(update) do
    drop_nil_values(%{
      trip_id: TripUpdate.trip_id(update),
      route_id: TripUpdate.route_id(update),
      direction_id: TripUpdate.direction_id(update),
      start_time: TripUpdate.start_time(update),
      start_date: encode_date(TripUpdate.start_date(update)),
      schedule_relationship: TripUpdate.schedule_relationship(update)
    })
  end
end
