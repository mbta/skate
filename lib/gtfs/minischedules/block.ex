defmodule Gtfs.Minischedules.Block do
  alias Gtfs.Block
  alias Gtfs.Hastus.Schedule
  alias Gtfs.Minischedules.Piece

  @type key :: {Schedule.id(), Block.id()}

  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          id: Block.id(),
          pieces: [Piece.t()]
        }

  @enforce_keys [
    :schedule_id,
    :id,
    :pieces
  ]

  defstruct [
    :schedule_id,
    :id,
    :pieces
  ]
end
