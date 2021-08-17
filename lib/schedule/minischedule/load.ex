defmodule Schedule.Minischedule.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  require Logger

  alias Schedule.Block
  alias Schedule.Gtfs.Service
  alias Schedule.Helpers
  alias Schedule.Hastus
  alias Schedule.Hastus.Activity
  alias Schedule.Run

  @spec runs_from_hastus([Activity.t()], [Hastus.Trip.t()], Schedule.Trip.by_id()) ::
          Run.by_id()
  def runs_from_hastus(activities, trips, trips_by_id) do
    activities_by_run = Enum.group_by(activities, &Activity.run_key/1)
    trips_by_run = Enum.group_by(trips, &Hastus.Trip.run_key/1)
    activities_and_trips_by_run = Helpers.zip_maps([activities_by_run, trips_by_run])

    trips_by_block = Enum.group_by(trips, &Hastus.Trip.block_key/1)

    runs =
      Enum.map(
        activities_and_trips_by_run,
        fn {run_key, [activities, trips]} ->
          run_from_hastus(run_key, activities, trips, trips_by_block, trips_by_id)
        end
      )

    Map.new(runs, fn run -> {Run.key(run), run} end)
  end

  @spec run_from_hastus(
          Run.key(),
          [Activity.t()] | nil,
          [Hastus.Trip.t()] | nil,
          %{Block.key() => [Hastus.Trip.t()]},
          Schedule.Trip.by_id()
        ) ::
          Run.t()
  def run_from_hastus(run_key, hastus_activities, trips, all_trips_by_block, trips_by_id) do
    {schedule_id, run_id} = run_key
    hastus_activities = hastus_activities || []
    trips = trips || []

    service_id = unique_service_id_for_trips(trips, trips_by_id)

    activities = Activity.to_pieces_and_breaks(hastus_activities, trips, all_trips_by_block)

    %Run{
      schedule_id: schedule_id,
      service_id: service_id,
      id: run_id,
      activities: activities
    }
  end

  @spec unique_service_id_for_trips([Hastus.Trip.t()], Schedule.Trip.by_id()) ::
          Service.id() | nil
  defp unique_service_id_for_trips(trips, trips_by_id) do
    service_ids =
      trips
      |> Enum.map(& &1.trip_id)
      |> (&Map.take(trips_by_id, &1)).()
      |> Map.values()
      |> Enum.filter(& &1)
      |> Enum.map(& &1.service_id)
      |> Enum.filter(& &1)
      |> Enum.uniq()

    case service_ids do
      [service_id] ->
        service_id

      _ ->
        nil
    end
  end
end
