defmodule Helpers do
  @doc """
  Apply a function to all of the values in a map

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

  @doc """
  Take only the items in the map where the value passes a predicate.

  iex> Helpers.filter_values(%{a: 1, b: 2}, fn x -> x == 1 end)
  %{a: 1}
  """
  @spec filter_values(%{optional(key) => value}, (value -> boolean())) :: %{optional(key) => value}
        when key: any(), value: any()
  def filter_values(map, f) do
    map
    |> Enum.filter(fn {_, v} -> f.(v) end)
    |> Map.new()
  end
end
