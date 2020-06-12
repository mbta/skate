defmodule Schedule.Minischedule.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  require Logger

  alias Schedule.Helpers
  alias Schedule.Hastus.Activity
  alias Schedule.Hastus.Trip
  alias Schedule.Minischedule.{AsDirected, Block, Break, Piece, Run}

  @spec from_hastus([Activity.t()], [Trip.t()]) ::
          %{runs: Run.by_id(), blocks: Block.by_id()}
  def from_hastus(activities, trips) do
    activities_by_run = Enum.group_by(activities, &Activity.run_key/1)
    trips_by_run = Enum.group_by(trips, &Trip.run_key/1)
    activities_and_trips_by_run = Helpers.zip_maps([activities_by_run, trips_by_run])

    runs =
      Enum.map(
        activities_and_trips_by_run,
        fn {run_key, [activities, trips]} ->
          run(run_key, activities, trips)
        end
      )

    runs_by_id = Map.new(runs, fn run -> {Run.key(run), run} end)
    pieces = Enum.flat_map(runs, &Run.pieces/1)
    blocks_by_id = blocks_from_pieces(pieces)

    %{
      runs: runs_by_id,
      blocks: blocks_by_id
    }
  end

  @spec run(Run.key(), [Activity.t()] | nil, [Trip.t()] | nil) :: Run.t()
  def run(run_key, activities, trips) do
    {schedule_id, run_id} = run_key
    activities = activities || []
    trips = trips || []

    activities =
      activities
      |> operator_activities_to_pieces(trips)
      |> as_directed_activities_to_pieces()
      |> add_deadheads_to_pieces()
      |> add_sign_ons_to_pieces()
      |> activities_to_breaks()

    %Run{
      schedule_id: schedule_id,
      id: run_id,
      activities: activities
    }
  end

  @spec operator_activities_to_pieces([Activity.t()], [Trip.t()]) :: [Activity.t() | Piece.t()]
  defp operator_activities_to_pieces(activities, trips) do
    Enum.map(activities, fn activity ->
      if activity_is_operator?(activity) do
        operator_activity_to_piece(activity, trips)
      else
        activity
      end
    end)
  end

  @spec activity_is_operator?(Activity.t()) :: boolean()
  defp activity_is_operator?(activity) do
    activity.activity_type == "Operator"
  end

  @spec operator_activity_to_piece(Activity.t(), [Trip.t()]) :: Piece.t() | Activity.t()
  defp operator_activity_to_piece(%Activity{activity_type: "Operator"} = activity, trips_in_run) do
    trips_in_piece =
      Enum.filter(trips_in_run, fn trip ->
        trip_in_operator(activity, trip)
      end)

    dehydrated_trips =
      if operator_is_as_directed?(activity) do
        [as_directed_from_trips(trips_in_piece)]
      else
        Enum.map(trips_in_piece, fn trip ->
          trip.trip_id
        end)
      end

    block_id =
      case trips_in_piece do
        [trip | _] ->
          trip.block_id

        _ ->
          Logger.warn(fn ->
            "Operator activity with no trips: #{activity.schedule_id} #{activity.run_id} start_time:#{
              activity.start_time
            }"
          end)

          nil
      end

    %Piece{
      schedule_id: activity.schedule_id,
      run_id: activity.run_id,
      block_id: block_id,
      start_time: activity.start_time,
      start_place: activity.start_place,
      trips: dehydrated_trips,
      end_time: activity.end_time,
      end_place: activity.end_place,
      start_mid_route?: false,
      end_mid_route?: false
    }
  end

  @spec trip_in_operator(Activity.t(), Trip.t()) :: boolean()
  defp trip_in_operator(%Activity{activity_type: "Operator"} = activity, trip) do
    String.contains?(trip.block_id, activity.partial_block_id) and
      trip.start_time >= activity.start_time and
      trip.start_time <= activity.end_time
  end

  @spec operator_is_as_directed?(Activity.t()) :: boolean()
  defp operator_is_as_directed?(%Activity{activity_type: "Operator"} = activity) do
    String.contains?(activity.partial_block_id, "ad")
  end

  @spec as_directed_from_trips([Trip.t()]) :: AsDirected.t()
  def as_directed_from_trips(trips_in_piece) do
    [
      %Trip{route_id: nil} = _pullout,
      as_directed_trip,
      %Trip{route_id: nil} = _pull_back
    ] = trips_in_piece

    kind =
      case as_directed_trip.route_id do
        "rad" -> :rad
        "wad" -> :wad
      end

    %AsDirected{
      kind: kind,
      start_time: as_directed_trip.start_time,
      end_time: as_directed_trip.end_time,
      start_place: as_directed_trip.start_place,
      end_place: as_directed_trip.end_place
    }
  end

  @spec as_directed_activities_to_pieces([Activity.t() | Piece.t()]) :: [Activity.t() | Piece.t()]
  defp as_directed_activities_to_pieces(activities_and_pieces) do
    Enum.map(activities_and_pieces, fn
      %Piece{} = piece ->
        piece

      %Activity{} = activity ->
        if activity_is_as_directed?(activity) do
          as_directed_activity_to_piece(activity)
        else
          activity
        end
    end)
  end

  @spec activity_is_as_directed?(Activity.t()) :: boolean()
  defp activity_is_as_directed?(activity) do
    activity.activity_type == "rad" or activity.activity_type == "wad"
  end

  @spec as_directed_activity_to_piece(Activity.t()) :: Piece.t()
  defp as_directed_activity_to_piece(activity) do
    %Piece{
      schedule_id: activity.schedule_id,
      run_id: activity.run_id,
      block_id: nil,
      start_time: activity.start_time,
      start_place: activity.start_place,
      trips: [
        %AsDirected{
          kind:
            case activity.activity_type do
              "wad" -> :wad
              "rad" -> :rad
            end,
          start_time: activity.start_time,
          end_time: activity.end_time,
          start_place: activity.start_place,
          end_place: activity.end_place
        }
      ],
      end_time: activity.end_time,
      end_place: activity.end_place
    }
  end

  @spec add_deadheads_to_pieces([Activity.t() | Piece.t()]) :: [Activity.t() | Piece.t()]
  defp add_deadheads_to_pieces([]) do
    []
  end

  defp add_deadheads_to_pieces([
         %Activity{activity_type: "Deadhead from"} = deadhead,
         %Piece{} = piece
         | rest
       ]) do
    dummy_trip = Schedule.Minischedule.Trip.from_leading_deadhead(deadhead, piece.block_id)

    new_piece = %{
      piece
      | start_time: deadhead.start_time,
        start_place: deadhead.start_place,
        trips: [dummy_trip | piece.trips]
    }

    add_deadheads_to_pieces([new_piece | rest])
  end

  defp add_deadheads_to_pieces([
         %Piece{} = piece,
         %Activity{activity_type: "Deadhead to"} = deadhead
         | rest
       ]) do
    dummy_trip = Schedule.Minischedule.Trip.from_following_deadhead(deadhead, piece.block_id)

    new_piece = %{
      piece
      | trips: piece.trips ++ [dummy_trip],
        end_time: deadhead.end_time,
        end_place: deadhead.end_place
    }

    add_deadheads_to_pieces([new_piece | rest])
  end

  defp add_deadheads_to_pieces([first | rest]) do
    [first | add_deadheads_to_pieces(rest)]
  end

  @spec add_sign_ons_to_pieces([Activity.t() | Piece.t()]) :: [Activity.t() | Piece.t()]
  defp add_sign_ons_to_pieces([]) do
    []
  end

  defp add_sign_ons_to_pieces([
         %Activity{activity_type: "Sign-on"} = sign_on,
         %Piece{} = piece
         | rest
       ]) do
    new_piece = %{
      piece
      | start_time: sign_on.start_time,
        start_place: sign_on.start_place
    }

    add_sign_ons_to_pieces([new_piece | rest])
  end

  defp add_sign_ons_to_pieces([first | rest]) do
    [first | add_sign_ons_to_pieces(rest)]
  end

  @spec activities_to_breaks([Activity.t() | Piece.t()]) :: [Break.t() | Piece.t()]
  defp activities_to_breaks(activities_and_pieces) do
    Enum.map(activities_and_pieces, fn
      %Piece{} = piece -> piece
      %Activity{} = activity -> Break.from_activity(activity)
    end)
  end

  @spec blocks_from_pieces([Piece.t()]) :: Block.by_id()
  defp blocks_from_pieces(pieces) do
    pieces
    |> Enum.filter(fn piece -> piece.block_id != nil end)
    |> Enum.group_by(&block_key_for_piece/1)
    |> Map.new(fn {{schedule_id, block_id} = block_key, pieces} ->
      {block_key,
       %Block{
         schedule_id: schedule_id,
         id: block_id,
         pieces: Enum.sort_by(pieces, fn piece -> piece.start_time end)
       }}
    end)
  end

  @spec block_key_for_piece(Piece.t()) :: Block.key()
  defp block_key_for_piece(piece) do
    {piece.schedule_id, piece.block_id}
  end
end
