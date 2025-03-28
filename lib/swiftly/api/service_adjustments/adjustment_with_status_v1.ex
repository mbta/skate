defmodule Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1 do
  @moduledoc """
  Provides struct and type for a AdjustmentWithStatusV1
  """

  @type t :: %__MODULE__{
          adjustmentType: String.t(),
          feedId: String.t() | nil,
          id: String.t(),
          notes: String.t() | nil,
          originalId: String.t() | nil,
          status: String.t(),
          validity: String.t(),
          validityReason: String.t() | nil
        }

  defstruct [
    :adjustmentType,
    :feedId,
    :id,
    :notes,
    :originalId,
    :status,
    :validity,
    :validityReason
  ]
end
