defmodule Swiftly.API.ServiceAdjustments.AdjustmentIdResponse do
  @moduledoc """
  Provides struct and type for a AdjustmentIdResponse
  """

  @type t :: %__MODULE__{adjustmentId: String.t()}

  defstruct [:adjustmentId]
end
