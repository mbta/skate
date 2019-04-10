defmodule Gtfs.Timepoint do
  @moduledoc """
  In GTFS, timepoints are known as "checkpoints"
  """

  alias Gtfs.Csv
  alias Gtfs.Helpers
  alias Gtfs.Trip

  @type id :: String.t()

  @type id_set :: MapSet.t(id())

  @spec includes_a_checkpoint_and_in_trip_id_set?(Csv.row(), id_set) :: boolean
  def includes_a_checkpoint_and_in_trip_id_set?(row, trip_id_set),
    do: includes_a_checkpoint?(row) && in_trip_id_set?(row, trip_id_set)

  @spec trip_timepoints_from_csv([Csv.row()]) :: %{optional(Trip.id()) => id()}
  def trip_timepoints_from_csv(stop_times_csv) do
    stop_times_csv
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(fn stop_time_row -> stop_time_row["checkpoint_id"] end)
    end)
  end

  @spec includes_a_checkpoint?(Csv.row()) :: boolean
  defp includes_a_checkpoint?(row), do: row["checkpoint_id"] != ""

  @spec in_trip_id_set?(Csv.row(), id_set) :: boolean
  defp in_trip_id_set?(row, trip_id_set), do: MapSet.member?(trip_id_set, row["trip_id"])
end
