defmodule Gtfs.Helpers do
  @doc """
  Returns a single list that attempts to keep items in order

  iex> Gtfs.Helpers.merge_lists([[:b, :c], [:a, :b]])
  [:a, :b, :c]

  iex> Gtfs.Helpers.merge_lists([[:c, :a], [:a, :b], [:b, :c]])
  [:c, :a, :b]

  iex> Gtfs.Helpers.merge_lists([[:a, :b]])
  [:a, :b]

  iex> Gtfs.Helpers.merge_lists([])
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
end
