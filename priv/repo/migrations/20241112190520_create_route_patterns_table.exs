defmodule Skate.Repo.Migrations.CreateRoutePatternsTable do
  use Ecto.Migration

  def change do
    execute("CREATE TYPE direction_name AS ENUM ('Inbound', 'Outbound')")

    create table(:route_patterns) do
      # add :hash, :integer
      add :gtfs_route_pattern_id, :string
      add :gtfs_route_pattern_name, :string
      add :gtfs_route_pattern_headsign, :string
      add :gtfs_route_pattern_direction_name, :direction_name
      add :gtfs_route_id, :string
      add :gtfs_route_name, :string
      add :gtfs_route_pattern_time_description, :string
      timestamps()
    end

    # create(
    #   unique_index(
    #     :route_patterns,
    #     [:hash],
    #     name: :route_patterns_unique_index
    #   )
    # )

    execute( "CREATE UNIQUE INDEX route_patterns_unique_index ON route_patterns (gtfs_route_pattern_id, gtfs_route_pattern_name, gtfs_route_pattern_headsign, gtfs_route_pattern_direction_name, gtfs_route_id, gtfs_route_name, coalesce(gtfs_route_pattern_time_description, ''))" )
  end
end
