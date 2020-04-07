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
  Like group_by, but preserves the order that the groups appear.
  Only groups consecutive elements together.

      iex> Schedule.Helpers.split_by(
      ...>   ["a1", "a2", "b3", "b4", "a5"],
      ...>   &String.first/1
      ...> )
      [
        {"a", ["a1", "a2"]},
        {"b", ["b3", "b4"]},
        {"a", ["a5"]}
      ]
  """
  @spec split_by([element], (element -> key)) :: [{key, [element]}]
        when element: term(), key: term()
  def split_by([], _key_fn) do
    []
  end

  def split_by(elements, key_fn) do
    first_key = key_fn.(List.first(elements))

    {first_group, rest} =
      Enum.split_while(elements, fn element -> key_fn.(element) == first_key end)

    [{first_key, first_group} | split_by(rest, key_fn)]
  end
end
