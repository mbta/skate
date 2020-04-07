defmodule Schedule.Minischedule.Piece do
  alias Schedule.Block
  alias Schedule.Trip
  alias Schedule.Hastus.Place
  alias Schedule.Hastus.Run
  alias Schedule.Hastus.Schedule

  @type key :: {Schedule.id(), Run.id(), Block.id()}

  @type sign_on_off :: %{
          time: String.t(),
          place: Place.id(),
          mid_route?: boolean()
        }

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          run_id: Run.id(),
          block_id: Block.id(),
          start: sign_on_off(),
          trip_ids: [Trip.id()],
          end: sign_on_off()
        }

  @enforce_keys [
    :schedule_id,
    :run_id,
    :block_id,
    :start,
    :trip_ids,
    :end
  ]

  defstruct [
    :schedule_id,
    :run_id,
    :block_id,
    :start,
    :trip_ids,
    :end
  ]
end
