defmodule Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1 do
  @moduledoc """
  Provides struct and type for a CreateAdjustmentRequestV1
  """

  @type t :: %__MODULE__{
          feedId: String.t(),
          feedName: String.t(),
          notes: String.t(),
          details: Swiftly.API.ServiceAdjustments.DetourV0CreationDetailsV1.t()
        }

  @derive Jason.Encoder
  defstruct [:details, :feedId, :feedName, :notes]
end
