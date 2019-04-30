defmodule Gtfs.StopTime do
  @moduledoc """
  An individual stop time. A sequence of stop times composes a trip.
  """

  alias Gtfs.Csv
  alias Gtfs.Data
  alias Gtfs.Helpers
  alias Gtfs.Trip

  @type trip_id_set :: MapSet.t(Trip.id())

  @spec trip_stops_from_csv([Csv.row()]) :: Data.trip_stops()
  def trip_stops_from_csv(stop_times_csv), do: by_trip_pid_mapped_to(stop_times_csv, "stop_id")

  @spec trip_timepoints_from_csv([Csv.row()]) :: Data.trip_timepoints()
  def trip_timepoints_from_csv(stop_times_csv),
    do: by_trip_pid_mapped_to(stop_times_csv, "checkpoint_id")

  @spec row_includes_a_checkpoint?(Csv.row()) :: boolean
  def row_includes_a_checkpoint?(row), do: row["checkpoint_id"] != ""

  @spec row_in_trip_id_set?(Csv.row(), trip_id_set) :: boolean
  def row_in_trip_id_set?(row, trip_id_set), do: MapSet.member?(trip_id_set, row["trip_id"])

  @spec by_trip_pid_mapped_to([Csv.row()], String.t()) :: %{Trip.id() => [any]}
  defp by_trip_pid_mapped_to(stop_times_csv, map_key) do
    stop_times_csv
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(fn stop_time_row -> stop_time_row[map_key] end)
    end)
  end
end
