defmodule Gtfs.Minischedules.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  alias Gtfs.Hastus.{Activity, Trip}
  alias Gtfs.Minischedules.Run

  @type loaded :: %{}

  @spec load([Trip.t()], [Activity.t()]) :: loaded()
  def load(trips, activities) do
    activities_by_run = group_activities_by_run(activities)
    trips_by_run = group_trips_by_run(trips)
    _run_groups = pair_activities_and_trips(activities_by_run, trips_by_run)
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

  @typep run_group :: {Run.key(), Activity.t(), Trip.t()}

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
