defmodule Swiftly.API.ServiceAdjustments.AdjustmentDetailsV1 do
  @moduledoc """
  Provides struct and type for a AdjustmentDetailsV1
  """

  @type t :: %__MODULE__{adjustmentType: :DETOUR_V0}

  defstruct [:adjustmentType]
end
