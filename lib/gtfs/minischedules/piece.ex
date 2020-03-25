defmodule Gtfs.Minischedules.Piece do
  alias Gtfs.{Block, Run}
  alias Gtfs.Hastus.{Place, Schedule}
  alias Gtfs.Minischedules.Trip

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
          trips: [Trip.t()],
          end: sign_on_off()
        }

  @enforce_keys [
    :schedule_id,
    :run_id,
    :block_id,
    :start,
    :trips,
    :end
  ]

  defstruct [
    :schedule_id,
    :run_id,
    :block_id,
    :start,
    :trips,
    :end
  ]
end
