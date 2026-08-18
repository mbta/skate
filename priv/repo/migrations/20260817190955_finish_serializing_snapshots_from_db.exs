defmodule Skate.Repo.Migrations.FinishSerializingSnapshotsFromDb do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      # missing snapshot values
      add :state_value, :map
      add :state_children, :map, null: true
      add :undo_stack, {:array, :map}, default: [], null: false

      # missing route information
      add :route_patterns, {:array, :map}
      # store route object rather than two parts
      add :route, :map
      remove :route_id, :string, null: true
      remove :route_name, :string, null: true

      # missing detour information
      add :edited_directions, :text, null: true
      add :detour_shape, :map, null: true
      add :route_segments, :map, null: true
      add :connection_points, :map, null: true
      add :missed_stops, {:array, :map}, null: true
    end
  end
end
