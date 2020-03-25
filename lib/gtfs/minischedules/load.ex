defmodule Gtfs.Minischedules.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  alias Gtfs.Hastus.{Activity, Trip}
  alias Gtfs.Minischedules.{Piece, Run}

  @type loaded :: %{}

  @spec load([Trip.t()], [Activity.t()]) :: loaded()
  def load(trips, activities) do
    _trip_groups = group_trips(trips)
    _activity_groups = group_activities(activities)
    %{}
  end

  # The trips that form a piece together
  @typep trip_group :: {Piece.key(), [Trip.t()]}

  @spec group_trips([Trip.t()]) :: [trip_group()]
  defp group_trips(trips) do
    split_by(trips, &piece_key_for_trip/1)
  end

  @spec piece_key_for_trip(Trip.t()) :: Piece.key()
  defp piece_key_for_trip(trip) do
    {trip.schedule_id, trip.run_id, trip.block_id}
  end

  # All the activities on a run
  @typep activity_group :: {Run.key(), [Activity.t()]}

  @spec group_activities([Activity.t()]) :: [activity_group()]
  defp group_activities(activities) do
    split_by(activities, &run_key_for_activity/1)
  end

  @spec run_key_for_activity(Activity.t()) :: Run.key()
  defp run_key_for_activity(activity) do
    {activity.schedule_id, activity.run_id}
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
