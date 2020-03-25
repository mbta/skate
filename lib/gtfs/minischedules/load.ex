defmodule Gtfs.Minischedules.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  alias Gtfs.Hastus.{Activity, Trip}
  alias Gtfs.Minischedules.{Block, Break, Piece, Run}

  @type loaded :: %{}

  @spec load([Activity.t()], [Trip.t()]) :: loaded()
  def load(activities, trips) do
    activities_by_run = group_activities_by_run(activities)
    trips_by_run = group_trips_by_run(trips)
    run_groups = pair_activities_and_trips(activities_by_run, trips_by_run)
    runs_and_pieces = Enum.map(run_groups, &run_and_pieces_from_run_group/1)
    _runs_by_id = Map.new(runs_and_pieces, fn {run_key, run, _pieces} -> {run_key, run} end)
    pieces = Enum.flat_map(runs_and_pieces, fn {_run_key, _run, pieces} -> pieces end)
    _block_by_id = blocks_from_pieces(pieces)
    %{}
  end

  # All the activities on a run
  @typep activity_group :: {Run.key(), [Activity.t()]}

  @spec group_activities_by_run([Activity.t()]) :: [activity_group()]
  defp group_activities_by_run(activities) do
    split_by(activities, &run_key_for_activity/1)
  end

  @spec run_key_for_activity(Activity.t()) :: Run.key()
  defp run_key_for_activity(activity) do
    {activity.schedule_id, activity.run_id}
  end

  # The trips that form a piece together
  @typep trip_group :: {Run.key(), [Trip.t()]}

  @spec group_trips_by_run([Trip.t()]) :: [trip_group()]
  defp group_trips_by_run(trips) do
    split_by(trips, &run_key_for_trip/1)
  end

  @spec run_key_for_trip(Trip.t()) :: Run.key()
  defp run_key_for_trip(trip) do
    {trip.schedule_id, trip.run_id}
  end

  @typep run_group :: {Run.key(), [Activity.t()], [Trip.t()]}

  # Assumes inputs are both sorted by run_key.
  # Assumes no runs are in trips.csv but not in activities.csv
  @spec pair_activities_and_trips([activity_group()], [trip_group()]) :: [run_group()]
  defp pair_activities_and_trips([], _trip_groups) do
    []
  end

  defp pair_activities_and_trips([activity_group | other_activity_groups], trip_groups) do
    {run_key, activities} = activity_group

    case trip_groups do
      [{^run_key, trips} | other_trip_groups] ->
        [
          {run_key, activities, trips}
          | pair_activities_and_trips(other_activity_groups, other_trip_groups)
        ]

      _ ->
        [
          {run_key, activities, []}
          | pair_activities_and_trips(other_activity_groups, trip_groups)
        ]
    end
  end

  @spec run_and_pieces_from_run_group(run_group) :: {Run.key(), Run.t(), [Piece.t()]}
  defp run_and_pieces_from_run_group({run_key, activities, trips}) do
    # TODO real implementation.
    # Currently, turns the trips directly into pieces, and makes every activity a break.
    # The real way to do it would be to integrate Sign-on and Operator activities into pieces.
    {schedule_id, run_id} = run_key

    breaks = Enum.map(activities, &break_from_activity/1)

    pieces =
      trips
      |> split_by(fn trip -> trip.block_id end)
      |> Enum.map(fn {_block_id, trips} ->
        first_trip = List.first(trips)
        last_trip = List.last(trips)

        %Piece{
          schedule_id: first_trip.schedule_id,
          run_id: first_trip.run_id,
          block_id: first_trip.block_id,
          start: %{
            time: first_trip.start_time,
            place: first_trip.start_place,
            mid_route?: false
          },
          trips: trips,
          end: %{
            time: last_trip.end_time,
            place: last_trip.end_place,
            mid_route?: false
          }
        }
      end)

    run = %Run{
      schedule_id: schedule_id,
      id: run_id,
      activities: breaks ++ pieces
    }

    {run_key, run, pieces}
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

  @spec blocks_from_pieces([Piece.t()]) :: Block.by_id()
  def blocks_from_pieces(pieces) do
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
  def block_key_for_piece(piece) do
    {piece.schedule_id, piece.block_id}
  end

  @doc """
  Like group_by, but preserves the order that the groups appear.
  Only groups consecutive elements together.
  """
  @spec split_by([element], (element -> key)) :: [{key, [element]}]
        when element: term(), key: term()
  def split_by([], _key_fn) do
    []
  end

  def split_by(elements, key_fn) do
    first_key = key_fn.(List.first(elements))

    {first_group, rest} =
      Enum.split_while(elements, fn element -> key_fn.(element) == first_key end)

    [{first_key, first_group} | split_by(rest, key_fn)]
  end
end
