defmodule Schedule.Minischedule.Piece do
  alias Schedule.Block
  alias Schedule.Trip
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
          # stored with trip ids, but sent to the frontend as full objects
          trips: [Trip.id()] | [Trip.t()],
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

  @derive Jason.Encoder

  defstruct [
    :schedule_id,
    :run_id,
    :block_id,
    :start,
    :trips,
    :end
  ]

  @spec hydrate(t(), Trip.by_id()) :: t()
  def hydrate(piece, trips_by_id) do
    trip_ids = piece.trips

    trips =
      Enum.map(trip_ids, fn trip_id ->
        trip = trips_by_id[trip_id]
        # Remove stop_times so we send a fraction of the data to the frontend.
        %{trip | stop_times: []}
      end)

    %{piece | trips: trips}
  end
end
