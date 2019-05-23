defmodule Concentrate.MockMerge do
  @moduledoc """
  Merges a list of Concentrate.Mergeable items.
  """
  alias Concentrate.Mergeable

  @doc """
  Implementation of the merge algorithm.

  We walk through the list of items, grouping them by key and merging as we
  come across items with a shared key.
  """
  @spec merge(Enumerable.t()) :: [Mergeable.t()]
  def merge(items)

  def merge([]) do
    []
  end

  def merge([_item] = items) do
    items
  end

  def merge(items) do
    items
    |> Enum.reduce(%{}, &merge_item/2)
    |> Map.values()
  end

  defp merge_item(item, acc) do
    module = Mergeable.impl_for!(item)
    key = {module, module.key(item)}

    Map.update(acc, key, item, &module.merge(&1, item))
  end
end
