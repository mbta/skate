defmodule Concentrate.Parser do
  @moduledoc """
  Behaviour for parsing remote data.

  Generally, these return a list of VehiclePosition, TripUpdate, or
  StopTimeUpdate data, but other data can be returned as well.

  For partial/differential updates, parsers should return `{:partial, list}`.
  """
  alias Concentrate.{StopTimeUpdate, TripUpdate, VehiclePosition}
  @type parsed :: VehiclePosition.t() | TripUpdate.t() | StopTimeUpdate.t()
  @callback parse(term) :: [term] | {:partial, [term]}
end
