defmodule Gtfs.Timepoint do
  @moduledoc """
  In GTFS, timepoints are known as "checkpoints"
  """

  @type id :: String.t()

  @type csv_row :: %{required(String.t()) => String.t()}

  @spec includes_a_checkpoint_and_member_of_trips?(MapSet.t(id()), csv_row) :: boolean
  def includes_a_checkpoint_and_member_of_trips?(trip_ids, row),
    do: includes_a_checkpoint?(row) && member_of_trips?(trip_ids, row)

  @spec includes_a_checkpoint?(csv_row) :: boolean
  defp includes_a_checkpoint?(row), do: row["checkpoint_id"] != ""

  @spec member_of_trips?(MapSet.t(id()), csv_row) :: boolean
  defp member_of_trips?(trip_ids, row), do: Enum.member?(trip_ids, row["trip_id"])
end
