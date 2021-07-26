defmodule Schedule.Piece do
  alias Schedule.Block
  alias Schedule.Gtfs.Timepoint
  alias Schedule.Hastus
  alias Schedule.Hastus.Place
  alias Schedule.Hastus.Run
  alias Schedule.Minischedule.AsDirected
  alias Schedule.Trip

  @type key :: {Hastus.Schedule.id(), Run.id(), Block.id()}

  @type mid_route_swing :: %{
          time: Util.Time.time_of_day(),
          trip: Trip.id() | Trip.t()
        }

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

  @spec hydrate(t(), Trip.by_id(), Timepoint.timepoint_names_by_id()) :: t()
  def hydrate(piece, trips_by_id, timepoint_names_by_id) do
    trip_ids = piece.trips

    trips =
      Enum.map(trip_ids, fn
        trip_id when is_binary(trip_id) ->
          trips_by_id[trip_id]

        %Trip{} = trip ->
          trip

        %AsDirected{} = as_directed ->
          as_directed
      end)
      |> Enum.map(&Trip.set_pretty_names(&1, timepoint_names_by_id))

    %{
      piece
      | trips: trips,
        start_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, piece.start_place),
        end_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, piece.end_place),
        start_mid_route?:
          piece.start_mid_route? &&
            hydrate_mid_route_swing(piece.start_mid_route?, trips_by_id, timepoint_names_by_id)
    }
  end

  @spec hydrate_mid_route_swing(
          mid_route_swing(),
          Schedule.Trip.by_id(),
          Timepoint.timepoint_names_by_id()
        ) :: mid_route_swing()
  defp hydrate_mid_route_swing(mid_route_swing, trips_by_id, timepoint_names_by_id) do
    trip_id = mid_route_swing.trip
    trip = trips_by_id |> Map.get(trip_id) |> Trip.set_pretty_names(timepoint_names_by_id)
    %{mid_route_swing | trip: trip}
  end
end
