defmodule Gtfs.Timepoint do
  @moduledoc """
  In GTFS, timepoints are known as "checkpoints"
  """

  alias Gtfs.Csv

  @type id :: String.t()

  @type id_set :: MapSet.t(id())

  @spec includes_a_checkpoint_and_in_id_set?(Csv.row(), id_set) :: boolean
  def includes_a_checkpoint_and_in_id_set?(timepoint_row, id_set),
    do: includes_a_checkpoint?(timepoint_row) && in_id_set?(timepoint_row, id_set)

  @spec includes_a_checkpoint?(Csv.row()) :: boolean
  defp includes_a_checkpoint?(timepoint_row), do: timepoint_row["checkpoint_id"] != ""

  @spec in_id_set?(Csv.row(), id_set) :: boolean
  defp in_id_set?(timepoint_row, id_set), do: MapSet.member?(id_set, timepoint_row["trip_id"])
end
