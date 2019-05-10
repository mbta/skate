defmodule Concentrate.Encoder.TripUpdates do
  @moduledoc """
  Encodes a list of parsed data into a TripUpdates.pb file.
  """
  @behaviour Concentrate.Encoder
  alias Concentrate.StopTimeUpdate
  import Concentrate.Encoder.GTFSRealtimeHelpers

  @impl Concentrate.Encoder
  def encode_groups(groups) when is_list(groups) do
    message = %{
      header: feed_header(),
      entity: trip_update_feed_entity(groups, &build_stop_time_update/1)
    }

    :gtfs_realtime_proto.encode_msg(message, :FeedMessage)
  end

  def build_stop_time_update(update) do
    drop_nil_values(%{
      stop_id: StopTimeUpdate.stop_id(update),
      stop_sequence: StopTimeUpdate.stop_sequence(update),
      arrival:
        stop_time_event(StopTimeUpdate.arrival_time(update), StopTimeUpdate.uncertainty(update)),
      departure:
        stop_time_event(StopTimeUpdate.departure_time(update), StopTimeUpdate.uncertainty(update)),
      schedule_relationship: schedule_relationship(StopTimeUpdate.schedule_relationship(update))
    })
  end
end
