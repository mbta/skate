defmodule Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1 do
  @moduledoc """
  Provides struct and type for a CreateAdjustmentRequestV1
  """

  @type reason ::
          :NONE
          | :CONSTRUCTION
          | :TECHNICAL_PROBLEM
          | :MAINTENANCE
          | :WEATHER
          | :ACCIDENT
          | :POLICE_ACTIVITY
          | :MEDICAL_EMERGENCY
          | :EVENT
          | :HOLIDAY
          | :DEMONSTRATION
          | :STRIKE
          | :OTHER_CAUSE
          | :UNKNOWN_CAUSE

  @type t :: %__MODULE__{
          details: Swiftly.API.ServiceAdjustments.DetourV0CreationDetailsV1.t(),
          feedId: String.t() | nil,
          feedName: String.t() | nil,
          notes: String.t() | nil,
          reason: reason() | nil,
          userFullname: String.t() | nil,
          userId: String.t() | nil
        }

  defstruct [:details, :feedId, :feedName, :notes, :reason, :userFullname, :userId]
end
