defprotocol Concentrate.Mergeable do
  @moduledoc """
  Protocol for structures which can be merged together.
  """

  @doc """
  Returns the key used to group items for merging.
  """
  @spec key(mergeable) :: term when mergeable: struct
  def key(mergeable)

  @doc """
  Merges two items into a list of items.
  """
  @spec merge(mergeable, mergeable) :: mergeable
        when mergeable: struct
  def merge(first, second)
end
