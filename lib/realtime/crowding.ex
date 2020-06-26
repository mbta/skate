defmodule Realtime.Crowding do
  @type t :: %__MODULE__{
          load: non_neg_integer(),
          capacity: non_neg_integer(),
          occupancy_status: String.t(),
          occupancy_percentage: float()
        }

  defstruct [:load, :capacity, :occupancy_status, :occupancy_percentage]
end
