defmodule Skate.Settings.Db.TabSettings do
  use Ecto.Schema
  import Ecto.Changeset
  alias Skate.Settings.Db.RouteTab

  @enforce_keys [:selected_route_ids, :ladder_directions, :ladder_crowding_toggles]

  schema "tab_settings" do
    belongs_to(:route_tab, RouteTab)
    field(:selected_route_ids, {:array, :string})
    field(:ladder_directions, :map)
    field(:ladder_crowding_toggles, :map)

    timestamps()
  end

  def changeset(tab_settings, attrs \\ %{}) do
    tab_settings
    |> cast(attrs, [:selected_route_ids, :ladder_directions, :ladder_crowding_toggles])
  end
end
