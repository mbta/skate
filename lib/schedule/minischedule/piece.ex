defmodule Schedule.Minischedule.Piece do
  alias Schedule.Block
  alias Schedule.Minischedule.Trip
  alias Schedule.Hastus
  alias Schedule.Hastus.Place
  alias Schedule.Hastus.Run

  @type key :: {Hastus.Schedule.id(), Run.id(), Block.id()}

  @type sign_on_off :: %{
          time: Util.Time.time_of_day(),
          place: Place.id(),
          mid_route?: boolean()
        }

  @type t :: %__MODULE__{
          schedule_id: Hastus.Schedule.id(),
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

  defmodule Hydrated do
    alias Schedule.Minischedule.Piece

    @type t :: %__MODULE__{
            schedule_id: Hastus.Schedule.id(),
            run_id: Run.id(),
            block_id: Block.id(),
            start: Piece.sign_on_off(),
            trips: [Trip.t()],
            end: Piece.sign_on_off()
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

  @spec hydrate(t(), Schedule.Trip.by_id()) :: Hydrated.t()
  def hydrate(piece, trips_by_id) do
    %Hydrated{
      schedule_id: piece.schedule_id,
      run_id: piece.run_id,
      block_id: piece.block_id,
      start: piece.start,
      trips:
        Enum.map(piece.trip_ids, fn trip_id ->
          Trip.from_full_trip(trips_by_id[trip_id])
        end),
      end: piece.end
    }
  end
end
