defmodule Gtfs.Timepoint do
  @moduledoc """
  A key stop along a route.

  In GTFS, timepoints are known as "checkpoints".
  """

  alias Gtfs.Csv
  alias Gtfs.Helpers
  alias Gtfs.Trip

  @type id :: String.t()

  @type trip_id_set :: MapSet.t(Trip.id())

  @spec trip_timepoints_from_csv([Csv.row()]) :: %{optional(Trip.id()) => [id()]}
  def trip_timepoints_from_csv(stop_times_csv) do
    stop_times_csv
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(fn stop_time_row -> stop_time_row["checkpoint_id"] end)
    end)
  end

  @spec row_includes_a_checkpoint?(Csv.row()) :: boolean
  def row_includes_a_checkpoint?(row), do: row["checkpoint_id"] != ""

  @spec row_in_trip_id_set?(Csv.row(), trip_id_set) :: boolean
  def row_in_trip_id_set?(row, trip_id_set), do: MapSet.member?(trip_id_set, row["trip_id"])
end
