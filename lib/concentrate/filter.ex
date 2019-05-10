defmodule Concentrate.Filter do
  @moduledoc """
  Defines the behaviour for filtering.

  Each filter gets called for each parsed item, along with some (optional)
  state that's passed along.

  Filter modules have one callback:
  * `filter/1`: takes the item and returns either:
    * `{:cont, new_item}`
    * `:skip`
  """
  require Logger

  @type data :: term
  @type return :: {:cont, data} | :skip

  @callback filter(data) :: return

  @doc """
  Given a list of Concentrate.Filter modules, applies them to the list of data.
  """
  @spec run([data], [module]) :: [data]
  def run(data_list, filter_list) do
    Enum.reduce(filter_list, data_list, &apply_filter_to_enum/2)
  end

  defp apply_filter_to_enum(module, enum) do
    Enum.flat_map(enum, &transform(module, &1))
  end

  defp transform(module, item) do
    case module.filter(item) do
      {:cont, item} -> [item]
      :skip -> []
    end
  end
end
