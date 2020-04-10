defmodule Schedule.Minischedule.Block do
  alias Schedule.Block
  alias Schedule.Minischedule.Piece
  alias Schedule.Hastus.Schedule

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
