defmodule Swiftly.API.ServiceAdjustments.DetourRouteDirectionCreationDetails do
  @moduledoc """
  Provides struct and type for a DetourRouteDirectionCreationDetails
  """

  @type t :: %__MODULE__{
          direction: String.t(),
          # Currently Unused
          newStops: nil,
          routeEntry: Swiftly.API.ServiceAdjustments.RouteLocation.t() | nil,
          routeExit: Swiftly.API.ServiceAdjustments.RouteLocation.t() | nil,
          routeShortName: String.t(),
          shape: [Swiftly.API.ServiceAdjustments.Coordinate.t()],
          skippedStops: [String.t()] | nil
        }

  @derive Jason.Encoder
  defstruct [
    :direction,
    :newStops,
    :routeEntry,
    :routeExit,
    :routeShortName,
    :shape,
    :skippedStops
  ]
end
