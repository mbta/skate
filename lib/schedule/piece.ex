defmodule Schedule.Piece do
  alias Schedule.Block
  alias Schedule.Hastus
  alias Schedule.Hastus.Place
  alias Schedule.Hastus.Run
  alias Schedule.AsDirected

  @type key :: {Hastus.Schedule.id(), Run.id(), Block.id()}

  @type mid_route_swing :: %{
          time: Util.Time.time_of_day(),
          trip: Schedule.Trip.id() | Schedule.Trip.t()
        }

  @type t :: %__MODULE__{
          schedule_id: Hastus.Schedule.id(),
          run_id: Run.id(),
          block_id: Block.id() | nil,
          start_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          # stored with trip ids, but sent to the frontend as full objects
          trips: [Schedule.Trip.id() | Schedule.Trip.t() | AsDirected.t()],
          end_time: Util.Time.time_of_day(),
          end_place: Place.id(),
          start_mid_route?: mid_route_swing() | nil,
          end_mid_route?: boolean()
        }

  @enforce_keys [
    :schedule_id,
    :run_id,
    :start_time,
    :start_place,
    :trips,
    :end_time,
    :end_place
  ]

  @derive Jason.Encoder

  defstruct [
    :schedule_id,
    :run_id,
    :block_id,
    :start_time,
    :start_place,
    :trips,
    :end_time,
    :end_place,
    start_mid_route?: nil,
    end_mid_route?: false
  ]

  @spec block_key(t()) :: Block.key()
  def block_key(piece) do
    {piece.schedule_id, piece.block_id}
  end

  # When we prepare a HASTUS export for a new rating for Skate, the export's
  # data starts not with the start date of the new rating, but rather the
  # current date. This allows us to import the new rating data as soon as it's
  # ready, rather than having to try to import it at the moment the new rating
  # is starting. But it also means that, at any given moment, Skate's HASTUS
  # data contains a significant number of trips that belong to either a past
  # or future rating.
  #
  # These trips will have a nil service_id. So do all non-revenue trips, but
  # since a piece should always have at least one revenue trip, if all trips
  # in a piece have a nil service_id, we can assume that all those trips are
  # from a non-current rating.
  @spec from_non_current_rating?(t()) :: boolean()
  def from_non_current_rating?(piece) do
    piece.trips
    |> Enum.reject(&match?(%AsDirected{}, &1))
    |> Enum.all?(&is_nil(&1.service_id))
  end
end
