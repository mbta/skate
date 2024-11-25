defmodule Skate.Repo.Migrations.CreateRoutePatternsTable do
  use Ecto.Migration

  def change do
    create table(:route_patterns) do
      add :gtfs_route_pattern_id, :string
      add :gtfs_route_pattern_name, :string
      add :gtfs_route_pattern_headsign, :string
      add :gtfs_route_pattern_direction_name, :string
      add :gtfs_route_id, :string
      add :gtfs_route_name, :string
      add :gtfs_route_pattern_time_description, :string
      timestamps()
    end
  end
end
