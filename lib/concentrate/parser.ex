defmodule Concentrate.Parser do
  @moduledoc """
  Behaviour for parsing remote data.

  Generally, these return a list of VehiclePosition, TripUpdate, or
  StopTimeUpdate data, but other data can be returned as well.

  """
  @callback parse(binary) :: [term()]
end
