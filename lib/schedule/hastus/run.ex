defmodule Schedule.Hastus.Run do
  @moduledoc false

  alias Schedule.Hastus.Schedule

  @type id :: String.t()

  @type key :: {Schedule.id(), id()}

  @doc """
      iex> Schedule.Hastus.Run.from_parts("123", "4567")
      "123-4567"

      # 0 pads short run ids
      iex> Schedule.Hastus.Run.from_parts("123", "501")
      "123-0501"
  """
  @spec from_parts(String.t(), String.t()) :: id()
  def from_parts(area_number, partial_run_id) do
    "#{area_number}-#{String.pad_leading(partial_run_id, 4, "0")}"
  end
end
