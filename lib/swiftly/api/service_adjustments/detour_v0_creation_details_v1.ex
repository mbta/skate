defmodule Swiftly.API.ServiceAdjustments.DetourV0CreationDetailsV1 do
  @moduledoc """
  Provides struct and type for a DetourV0CreationDetailsV1
  """

  @type t :: %__MODULE__{
          adjustmentType: String.t(),
          beginTime: DateTime.t() | nil,
          detourRouteDirectionDetails:
            [Swiftly.API.ServiceAdjustments.DetourRouteDirectionCreationDetails.t()] | nil,
          endTime: DateTime.t() | nil,
          recurrenceProperties: Swiftly.API.ServiceAdjustments.RecurrenceProperties.t() | nil
        }

  defstruct [
    :adjustmentType,
    :beginTime,
    :detourRouteDirectionDetails,
    :endTime,
    :recurrenceProperties
  ]
end
