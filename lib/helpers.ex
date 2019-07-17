defmodule Helpers do
  @doc """
  Apply a function to all of the vaues in a map

  iex> Helpers.map_values(%{a: 1, b: 2}, fn x -> x+1 end)
  %{a: 2, b: 3}
  """
  @spec map_values(%{optional(key) => value1}, (value1 -> value2)) :: %{optional(key) => value2}
        when key: any(), value1: any(), value2: any()
  def map_values(map, f) do
    Map.new(map, fn {key, value} ->
      {key, f.(value)}
    end)
  end
end
