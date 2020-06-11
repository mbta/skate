defmodule Schedule.Minischedule.Piece do
  alias Schedule.Block
  alias Schedule.Gtfs.Timepoint
  alias Schedule.Hastus
  alias Schedule.Hastus.Place
  alias Schedule.Hastus.Run
  alias Schedule.Minischedule.AsDirected
  alias Schedule.Minischedule.Trip

  @type key :: {Hastus.Schedule.id(), Run.id(), Block.id()}

  @type t :: %__MODULE__{
          schedule_id: Hastus.Schedule.id(),
          run_id: Run.id(),
          block_id: Block.id() | nil,
          start_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          # stored with trip ids, but sent to the frontend as full objects
          trips: [Trip.id() | Trip.t() | AsDirected.t()],
          end_time: Util.Time.time_of_day(),
          end_place: Place.id(),
          start_mid_route?: boolean(),
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
    start_mid_route?: false,
    end_mid_route?: false
  ]

  @spec hydrate(t(), Schedule.Trip.by_id(), Timepoint.timepoint_names_by_id()) :: t()
  def hydrate(piece, trips_by_id, timepoint_names_by_id) do
    trip_ids = piece.trips

    trips =
      Enum.map(trip_ids, fn
        trip_id when is_binary(trip_id) ->
          full_trip = trips_by_id[trip_id]

          Trip.from_full_trip(full_trip, timepoint_names_by_id)

        %Trip{} = trip ->
          trip

        %AsDirected{} = as_directed ->
          as_directed
      end)

    %{
      piece
      | trips: trips,
        start_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, piece.start_place),
        end_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, piece.end_place)
    }
  end
end
