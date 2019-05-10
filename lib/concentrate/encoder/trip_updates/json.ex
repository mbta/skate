defmodule Concentrate.Encoder.TripUpdates.JSON do
  @moduledoc """
  Encodes a list of parsed data into a TripUpdates.json file.
  """
  @behaviour Concentrate.Encoder
  alias Concentrate.Encoder.TripUpdates
  import Concentrate.Encoder.GTFSRealtimeHelpers

  @impl Concentrate.Encoder
  def encode_groups(groups) when is_list(groups) do
    message = %{
      header: feed_header(),
      entity: trip_update_feed_entity(groups, &TripUpdates.build_stop_time_update/1)
    }

    Jason.encode!(message)
  end
end
