defmodule Gtfs.Timepoint do
  @moduledoc """
  In GTFS, timepoints are known as "checkpoints"
  """

  @type id :: String.t()

  @type csv_row :: %{required(String.t()) => String.t()}
  @type id_set :: MapSet.t(id())

  @spec includes_a_checkpoint_and_in_id_set?(csv_row, id_set) :: boolean
  def includes_a_checkpoint_and_in_id_set?(row, id_set),
    do: includes_a_checkpoint?(row) && in_id_set?(row, id_set)

  @spec includes_a_checkpoint?(csv_row) :: boolean
  defp includes_a_checkpoint?(row), do: row["checkpoint_id"] != ""

  @spec in_id_set?(csv_row, id_set) :: boolean
  defp in_id_set?(row, id_set), do: MapSet.member?(id_set, row["trip_id"])
end
