defmodule Swiftly.API.ServiceAdjustments.DetourV0CreationDetailsV1 do
  @moduledoc """
  Provides struct and type for a DetourV0CreationDetailsV1
  """

  @type t :: %__MODULE__{
          adjustmentType: :DETOUR_V0,
          beginTime: DateTime.t() | nil,
          detourRouteDirectionDetails:
            [Swiftly.API.ServiceAdjustments.DetourRouteDirectionCreationDetails.t()] | nil,
          endTime: DateTime.t() | nil,
          recurrenceProperties: Swiftly.API.ServiceAdjustments.RecurrenceProperties.t() | nil
        }

  @derive Jason.Encoder
  defstruct [
    :beginTime,
    :detourRouteDirectionDetails,
    :endTime,
    :recurrenceProperties,
    adjustmentType: :DETOUR_V0
  ]
end
