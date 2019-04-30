defmodule Gtfs.StopTime do
  @moduledoc """
  An individual stop time. A sequence of stop times composes a trip.
  """

  alias Gtfs.Csv
  alias Gtfs.Data
  alias Gtfs.Helpers
  alias Gtfs.Timepoint
  alias Gtfs.Trip

  @type trip_id_set :: MapSet.t(Trip.id())

  @spec trip_stops_from_csv([Csv.row()]) :: Data.trip_stops()
  def trip_stops_from_csv(stop_times_csv),
    do: by_trip_pid_mapped_to(stop_times_csv, fn stop_time_row -> stop_time_row["stop_id"] end)

  @spec trip_timepoints_from_csv([Csv.row()]) :: Data.trip_timepoints()
  def trip_timepoints_from_csv(stop_times_csv),
    do:
      by_trip_pid_mapped_to(stop_times_csv, fn stop_time_row ->
        %Timepoint{id: stop_time_row["checkpoint_id"], stop_id: stop_time_row["stop_id"]}
      end)

  @spec row_includes_a_checkpoint?(Csv.row()) :: boolean
  def row_includes_a_checkpoint?(row), do: row["checkpoint_id"] != ""

  @spec row_in_trip_id_set?(Csv.row(), trip_id_set) :: boolean
  def row_in_trip_id_set?(row, trip_id_set), do: MapSet.member?(trip_id_set, row["trip_id"])

  @spec by_trip_pid_mapped_to([Csv.row()], (Csv.row() -> result_type)) :: %{
          Trip.id() => [result_type]
        }
        when result_type: var
  defp by_trip_pid_mapped_to(stop_times_csv, row_map_fn) do
    stop_times_csv
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(row_map_fn)
    end)
  end
end
