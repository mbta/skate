defmodule Gtfs.Minischedules.Run do
  alias Gtfs.Hastus.Schedule
  alias Gtfs.Minischedules.{Break, Piece}
  alias Gtfs.Run

  @type key :: {Schedule.id(), Run.id()}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          id: Run.id(),
          activities: [Piece.t() | Break.t()]
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
