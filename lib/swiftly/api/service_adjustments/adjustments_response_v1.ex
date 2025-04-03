defmodule Swiftly.API.ServiceAdjustments.AdjustmentsResponseV1 do
  @moduledoc """
  Provides struct and type for a AdjustmentsResponseV1
  """
  alias Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1

  @type t :: %__MODULE__{adjustments: [AdjustmentWithStatusV1.t()]}

  defstruct [:adjustments]

  def load(%{"adjustments" => adjustments}) do
    %__MODULE__{
      adjustments: Enum.map(adjustments, &AdjustmentWithStatusV1.load/1)
    }
  end
end
