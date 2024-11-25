# Should this live here under detours?
# I don't like how the db folders are scattered throughout /lib subdirectories.
# I'd rather they all live in one subfolder. 
# Example: there's db files in /notifications and /skate/detours and /skate/settings, etc
defmodule Skate.Detours.Db.RoutePattern do
  @moduledoc """
  Ecto Model for `route_patterns` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Detours.Db.Detour
  alias Skate.Detours.DirectionName

  @required_fields [
    :gtfs_route_pattern_id,
    :gtfs_route_pattern_name,
    :gtfs_route_pattern_headsign,
    # :gtfs_route_pattern_shape,
    :gtfs_route_pattern_direction_name,
    :gtfs_route_id,
    :gtfs_route_name
  ]

  typed_schema "route_patterns" do
    field(:gtfs_route_pattern_id, :string)
    field(:gtfs_route_pattern_name, :string)
    field(:gtfs_route_pattern_headsign, :string)
    field(:gtfs_route_pattern_direction_name, DirectionName)

    # The given route pattern will always have the given route
    # Does it need to be stored here as well?
    field(:gtfs_route_id, :string)
    field(:gtfs_route_name, :string)

    field(:gtfs_route_pattern_time_description, :string)

    # To be added: gtfs_route_pattern_shape (separate table)

    has_many(:detours, Detour)

    timestamps()
  end

  def changeset(route_pattern, attrs \\ %{}) do
    route_pattern
    |> cast(attrs, @required_fields, [:gtfs_route_pattern_time_description])
    |> validate_required(@required_fields)
    |> unique_constraint(
      [
        :gtfs_route_pattern_id,
        :gtfs_route_pattern_name,
        :gtfs_route_pattern_headsign,
        :gtfs_route_pattern_direction_name,
        :gtfs_route_id,
        :gtfs_route_name,
        :gtfs_route_pattern_time_description
      ],
      name: :route_patterns_unique_index
    )
  end
end
