defmodule Skate.Detours.SnapshotSerde do
  @moduledoc """
  Deserializes XState JSON Snapshots to Ecto Database Changesets
  Serializes Ecto Database Structs into XState JSON Snapshots
  """

  @doc """
  Converts a XState JSON Snapshot to Detours Database Changeset
  """
  def deserialize(user_id, %{} = snapshot) do
    Skate.Detours.Db.Detour.changeset(
      %Skate.Detours.Db.Detour{
        # `id` is `nil` by default, so a `nil` `id` should be fine
        id: id_from_snapshot(snapshot),
        author_id: user_id
      },
      %{
        # Save Snapshot to DB until we've fully transitioned to serializing
        # snapshots from DB data
        state: snapshot
      }
    )
  end

  @doc """
  Extracts the Detour ID from a XState Snapshot
  """
  def id_from_snapshot(%{"context" => %{"uuid" => id}}), do: id
  def id_from_snapshot(%{"context" => %{}}), do: nil
end
