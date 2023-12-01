defmodule Realtime.Helpers do
  @moduledoc false

  @doc """
  Returns the first element that matches the condition, and also the element that appears before it in the list.

  Returns nil if no element matches or if there is no previous element (because the first element matched)

      iex> Realtime.Helpers.find_and_previous([1,2,3,4], fn x -> x > 2 end)
      {2,3}

      iex> Realtime.Helpers.find_and_previous([], fn x -> x > 2 end)
      nil

      iex> Realtime.Helpers.find_and_previous([3,4], fn x -> x > 2 end)
      nil

      iex> Realtime.Helpers.find_and_previous([1,2], fn x -> x > 2 end)
      nil
  """
  @spec find_and_previous([element], (element -> boolean())) :: {element, element} | nil
        when element: any()
  def find_and_previous(elements, condition) do
    case Enum.find_index(elements, condition) do
      nil -> nil
      0 -> nil
      i -> {Enum.at(elements, i - 1), Enum.at(elements, i)}
    end
  end
end
