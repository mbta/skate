defmodule Swiftly.API.ServiceAdjustments.RouteLocation do
  @moduledoc """
  Provides struct and type for a RouteLocation
  """

  @type t :: %__MODULE__{
          distanceFromPreviousStop: number | nil,
          latLon: Swiftly.API.ServiceAdjustments.Coordinate.t() | nil,
          nextStopId: String.t() | nil,
          previousStopId: String.t() | nil
        }

  defstruct [:distanceFromPreviousStop, :latLon, :nextStopId, :previousStopId]
end
