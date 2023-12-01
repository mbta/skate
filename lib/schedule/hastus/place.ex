defmodule Schedule.Hastus.Place do
  @moduledoc false

  @type id :: String.t()

  @spec map_input_place_id(id) :: id
  def map_input_place_id("dudly"), do: "nubn"
  def map_input_place_id(id), do: id
end
