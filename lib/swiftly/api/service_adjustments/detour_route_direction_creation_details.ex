defmodule Swiftly.API.ServiceAdjustments.DetourRouteDirectionCreationDetails do
  @moduledoc """
  Provides struct and type for a DetourRouteDirectionCreationDetails
  """

  @type t :: %__MODULE__{
          direction: String.t(),
          routeShortName: String.t(),
          shape: [Swiftly.API.ServiceAdjustments.Coordinate.t()],
          skippedStops: [String.t()] | nil
        }

  @derive Jason.Encoder
  defstruct [
    :direction,
    :routeShortName,
    :shape,
    :skippedStops
  ]
end
