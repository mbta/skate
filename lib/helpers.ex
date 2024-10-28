defmodule Helpers do
  @moduledoc false

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
  Apply a function to all of the keys in a map

  iex> Helpers.map_keys(%{"a" => 1, "b" => 2}, fn s -> s <> s end)
  %{"aa" => 1, "bb" => 2}

  If any resulting keys overlap, one arbitrary entry will be kept.
  """
  @spec map_keys(%{optional(key1) => value}, (key1 -> key2)) :: %{optional(key2) => value}
        when key1: any(), key2: any(), value: any()
  def map_keys(map, f) do
    Map.new(map, fn {key, value} ->
      {f.(key), value}
    end)
  end

  @doc """
  Take only the items in the map where the value passes a predicate.

  iex> Helpers.filter_values(%{a: 1, b: 2}, fn x -> x == 1 end)
  %{a: 1}
  """
  @spec filter_values(%{optional(key) => value}, (value -> boolean())) ::
          %{optional(key) => value}
        when key: any(), value: any()
  def filter_values(map, f) do
    map
    |> Enum.filter(fn {_, v} -> f.(v) end)
    |> Map.new()
  end
end
