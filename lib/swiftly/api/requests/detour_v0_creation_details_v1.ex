defmodule Swiftly.Api.Requests.DetourV0CreationDetailsV1 do
  @moduledoc """
  Module to represent a DetourV0CreationDetailsV1 request for swiftly
  """
  defstruct [
    :adjustmentType,
    :detourRouteDirectionDetails
  ]

  @typedoc """
  "DETOUR_V0"
  """
  @type adjustment_type :: :DETOUR_V0
  @typedoc """
  "0" | "1"
  """
  @type direction_id :: String.t()

  @type shape :: [[float()]]

  @type t :: %__MODULE__{
          adjustmentType: adjustment_type(),
          detourRouteDirectionDetails: %{
            routeShortName: String.t(),
            direction: direction_id(),
            shape: shape()
          }
        }
end
