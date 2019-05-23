defprotocol Concentrate.Mergeable do
  @moduledoc """
  Protocol for structures which can be merged together.
  """

  @doc """
  Returns the key used to group items for merging.
  """
  @spec key(mergeable, Keyword.t()) :: term when mergeable: struct
  def key(mergeable, opts \\ [])

  @doc """
  Merges two items into a list of items.
  """
  @spec merge(mergeable, mergeable) :: mergeable
        when mergeable: struct
  def merge(first, second)
end
