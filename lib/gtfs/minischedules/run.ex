defmodule Gtfs.Minischedules.Run do
  alias Gtfs.Block
  alias Gtfs.Hastus.Schedule
  alias Gtfs.Minischedules.{Break, Piece}

  @type t :: %__MODULE__{
    schedule_id: Schedule.id(),
    id: Block.id(),
    activities: [Piece.t() | Break.t()],
  }

  @enforce_keys [
    :schedule_id,
    :id,
    :activities
  ]

  defstruct [
    :schedule_id,
    :id,
    :activities
  ]
end
