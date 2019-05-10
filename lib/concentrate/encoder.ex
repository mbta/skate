defmodule Concentrate.Encoder do
  @moduledoc """
  Encoders define a single callback:

  encode_groups/1: given a pre-grouped list of data, returns as binary
  """
  @callback encode_groups([Concentrate.Encoder.GTFSRealtimeHelpers.trip_group()]) :: binary
end
