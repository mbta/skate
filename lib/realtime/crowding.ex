defmodule Realtime.Crowding do
  @moduledoc false

  @type t :: %__MODULE__{
          load: non_neg_integer() | nil,
          capacity: non_neg_integer() | nil,
          occupancy_status: String.t(),
          occupancy_percentage: float() | nil
        }

  @derive Jason.Encoder
  defstruct [:load, :capacity, :occupancy_status, :occupancy_percentage]
end
