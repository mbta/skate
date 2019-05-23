defmodule Concentrate.TestMergeable do
  @moduledoc """
  Simple Mergeable for testing. Value is a list of items, and merging is a
  unique, sorted list of both provided values.
  """
  use ExUnitProperties
  defstruct [:key, :value]

  def new(key, value) do
    %__MODULE__{
      key: key,
      value: List.wrap(value)
    }
  end

  @doc """
  Helper which returns a StreamData of TestMergeables.
  """
  @spec mergeables :: StreamData.t()
  def mergeables do
    # get a keyword list of integers, filter out duplicate keys, then create
    # mergeables
    StreamData.integer()
    |> StreamData.keyword_of()
    |> StreamData.map(fn list -> Enum.uniq_by(list, &elem(&1, 0)) end)
    |> StreamData.map(fn list -> Enum.map(list, fn {k, v} -> new(k, v) end) end)
  end

  defimpl Concentrate.Mergeable do
    def key(%{key: key}, _opts \\ []), do: key

    def merge(first, second) do
      value =
        [first.value, second.value]
        |> Enum.concat()
        |> Enum.uniq()
        |> Enum.sort()

      @for.new(first.key, value)
    end
  end
end
