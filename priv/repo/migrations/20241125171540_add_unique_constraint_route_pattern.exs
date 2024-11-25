defmodule Skate.Repo.Migrations.AddUniqueConstraintRoutePattern do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create(
      index(
        :route_patterns,
        [
          :gtfs_route_pattern_id,
          :gtfs_route_pattern_name,
          :gtfs_route_pattern_headsign,
          :gtfs_route_pattern_direction_name,
          :gtfs_route_id,
          :gtfs_route_name,
          :gtfs_route_pattern_time_description
        ],
        unique: true,
        nulls_distinct: false,
        concurrently: true,
        name: "route_patterns_unique_index"
      )
    )
  end
end
