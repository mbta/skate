defmodule Swiftly.API.ServiceAdjustments.AdjustmentsResponseV1 do
  @moduledoc """
  Provides struct and type for a AdjustmentsResponseV1
  """

  @type t :: %__MODULE__{adjustments: [Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1.t()]}

  defstruct [:adjustments]
end
