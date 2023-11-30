defmodule Schedule.Helpers do
  @moduledoc false

  @doc """
  Returns a single list that attempts to keep items in order

      iex> Schedule.Helpers.merge_lists([[:b, :c], [:a, :b]])
      [:a, :b, :c]

      iex> Schedule.Helpers.merge_lists([[:a, :b]])
      [:a, :b]

      iex> Schedule.Helpers.merge_lists([])
      []

  If there's a cycle, gives preference to earlier inputs.

      iex> Schedule.Helpers.merge_lists([[:a, :b], [:b, :c], [:c, :a]])
      [:a, :b, :c]

      iex> Schedule.Helpers.merge_lists([[:a, :b], [:b, :a, :b]])
      [:a, :b]

  Non-greedily avoids conflicts when possible.

      iex> Schedule.Helpers.merge_lists([[:a, :b], [:a, :c], [:b, :c]])
      [:a, :b, :c]

      # Passing this test would require a completely new implementation
      #iex> Schedule.Helpers.merge_lists([[:a, :b], [:a, :c], [:c, :b]])
      #[:a, :c, :b]
  """
  @spec merge_lists([[any()]]) :: [any()]
  def merge_lists(lists) do
    lists
    |> Enum.map(&Enum.uniq/1)
    |> Enum.reduce([], fn next_order, previously_defined_orders ->
      merge_two_lists(previously_defined_orders, next_order)
    end)
  end

  @spec merge_two_lists([any()], [any()]) :: [any()]
  defp merge_two_lists(list1, list2) do
    edits = List.myers_difference(list1, list2)

    edits
    |> Enum.flat_map(fn {_action, elements} -> elements end)
    |> Enum.uniq()
  end

  @doc """
  Groups up the values that appear on the same key in the two maps.
  Leaves nil if a value is not present in one map.

      iex> Schedule.Helpers.zip_maps([%{a: "a1", b: "b1"}, %{b: "b2", c: "c2"}])
      %{a: ["a1", nil], b: ["b1", "b2"], c: [nil, "c2"]}

  Can work with any number of inputs.
  Each value in the result will be the same length as the length of the input.

      iex> Schedule.Helpers.zip_maps([%{x: "1"}, %{}, %{x: "3"}])
      %{x: ["1", nil, "3"]}

      iex> Schedule.Helpers.zip_maps([])
      %{}
  """
  @spec zip_maps([%{k => any()}]) :: %{k => [any()]} when k: any()
  def zip_maps(maps) do
    keys =
      maps
      |> Enum.map(&Map.keys/1)
      |> List.flatten()
      |> Enum.uniq()

    Map.new(keys, fn k ->
      {k, Enum.map(maps, fn map -> Map.get(map, k) end)}
    end)
  end
end
