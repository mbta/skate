defmodule Gtfs.Direction do
  @type id :: 0 | 1

  @spec from_string(String.t()) :: id()
  def from_string("0"), do: 0
  def from_string("1"), do: 1
end
