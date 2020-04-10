defmodule Schedule.Helpers do
  @doc """
  Returns a single list that attempts to keep items in order

      iex> Schedule.Helpers.merge_lists([[:b, :c], [:a, :b]])
      [:a, :b, :c]

      iex> Schedule.Helpers.merge_lists([[:c, :a], [:a, :b], [:b, :c]])
      [:c, :a, :b]

      iex> Schedule.Helpers.merge_lists([[:a, :b]])
      [:a, :b]

      iex> Schedule.Helpers.merge_lists([])
      []
  """
  @spec merge_lists([[any()]]) :: [any()]
  def merge_lists(lists) do
    Enum.reduce(lists, [], fn next_order, previously_defined_orders ->
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
  Pairs up the values that appear on the same key in the two maps.
  Leaves nil if a value is not present in one map.

      iex> Schedule.Helpers.pair_maps(%{a: "a1", b: "b1"}, %{b: "b2", c: "c2"})
      %{a: {"a1", nil}, b: {"b1", "b2"}, c: {nil, "c2"}}
  """
  @spec pair_maps(%{k => v1}, %{k => v2}) :: %{k => {v1 | nil, v2 | nil}}
        when k: any(), v1: any(), v2: any()
  def pair_maps(m1, m2) do
    keys = Enum.uniq(Map.keys(m1) ++ Map.keys(m2))

    Map.new(keys, fn k ->
      {k, {Map.get(m1, k), Map.get(m2, k)}}
    end)
  end
end
