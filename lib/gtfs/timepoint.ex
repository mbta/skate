defmodule Gtfs.Timepoint do
  @moduledoc """
  A key stop along a route.

  In GTFS, timepoints are known as "checkpoints".
  """

  alias Gtfs.Stop

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          stop_id: Stop.id()
        }

  @enforce_keys [
    :id,
    :stop_id
  ]

  defstruct [
    :id,
    :stop_id
  ]
end
