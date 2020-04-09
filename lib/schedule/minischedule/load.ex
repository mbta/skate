defmodule Schedule.Minischedule.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  alias Schedule.Helpers
  alias Schedule.Hastus.Activity
  alias Schedule.Hastus.Trip
  alias Schedule.Minischedule.{Block, Break, Piece, Run}

  @spec from_hastus([Activity.t()], [Trip.t()]) ::
          %{runs: Run.by_id(), blocks: Block.by_id()}
  def from_hastus(activities, trips) do
    activities_by_run = Enum.group_by(activities, fn a -> {a.schedule_id, a.run_id} end)
    trips_by_run = Enum.group_by(trips, fn t -> {t.schedule_id, t.run_id} end)
    activities_and_trips_by_run = Helpers.pair_maps(activities_by_run, trips_by_run)

    runs_by_id =
      Map.new(
        activities_and_trips_by_run,
        fn {run_key, {activities, trips}} ->
          run = run(run_key, activities, trips)
          {run_key, run}
        end
      )

    pieces = pieces_from_runs(runs_by_id)
    blocks_by_id = blocks_from_pieces(pieces)

    %{
      runs: runs_by_id,
      blocks: blocks_by_id
    }
  end

  @spec run(Run.key(), [Activity.t()] | nil, [Trip.t()] | nil) :: Run.t()
  def run(run_key, activities, trips) do
    activities = activities || []
    trips = trips || []
    # TODO real implementation.
    # Currently, turns the trips directly into pieces, and makes every activity a break.
    # The real way to do it would be to integrate Sign-on and Operator activities into pieces.
    {schedule_id, run_id} = run_key

    breaks = Enum.map(activities, &break_from_activity/1)

    pieces =
      trips
      |> Enum.group_by(fn trip -> trip.block_id end)
      |> Enum.map(fn {block_id, trips} ->
        first_trip = List.first(trips)
        last_trip = List.last(trips)

        %Piece{
          schedule_id: schedule_id,
          run_id: run_id,
          block_id: block_id,
          start: %{
            time: first_trip.start_time,
            place: first_trip.start_place,
            mid_route?: false
          },
          trip_ids: Enum.map(trips, fn trip -> trip.trip_id end),
          end: %{
            time: last_trip.end_time,
            place: last_trip.end_place,
            mid_route?: false
          }
        }
      end)

    %Run{
      schedule_id: schedule_id,
      id: run_id,
      activities: breaks ++ pieces
    }
  end

  @spec break_from_activity(Activity.t()) :: Break.t()
  defp break_from_activity(activity) do
    %Break{
      break_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time,
      start_place: activity.start_place,
      end_place: activity.end_place
    }
  end

  @spec pieces_from_runs(Run.by_id()) :: [Piece.t()]
  defp pieces_from_runs(runs_by_id) do
    Enum.flat_map(runs_by_id, fn {_run_key, run} ->
      Enum.filter(run.activities, fn activity -> match?(%Piece{}, activity) end)
    end)
  end

  @spec blocks_from_pieces([Piece.t()]) :: Block.by_id()
  defp blocks_from_pieces(pieces) do
    pieces
    |> Enum.group_by(&block_key_for_piece/1)
    |> Enum.map(fn {{schedule_id, block_id} = block_key, pieces} ->
      {block_key,
       %Block{
         schedule_id: schedule_id,
         id: block_id,
         pieces: Enum.sort_by(pieces, fn piece -> piece.start.time end)
       }}
    end)
    |> Map.new()
  end

  @spec block_key_for_piece(Piece.t()) :: Block.key()
  defp block_key_for_piece(piece) do
    {piece.schedule_id, piece.block_id}
  end
end
