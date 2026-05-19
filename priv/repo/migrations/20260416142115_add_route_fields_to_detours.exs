defmodule Skate.Repo.Migrations.AddRouteFieldsToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :route_id, :string, null: true
      add :route_name, :string, null: true
      add :route_pattern_id, :string, null: true
      add :route_pattern_name, :string, null: true
      add :headsign, :string, null: true
      add :direction, :string, null: true
      add :coordinates, {:array, :map}, null: true
    end
  end
end
