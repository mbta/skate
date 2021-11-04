defmodule Skate.Settings.Db.RouteTab do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  @type t :: %__MODULE__{}

  schema "route_tabs" do
    belongs_to(:user, User)
    field(:preset_name, :string)
    field(:selected_route_ids, {:array, :string})
    field(:ladder_directions, :map)
    field(:ladder_crowding_toggles, :map)
    field(:ordering, :integer)

    belongs_to(:save_changes_to_tab, Skate.Settings.Db.RouteTab,
      foreign_key: :save_changes_to_tab_id
    )

    timestamps()
  end

  def changeset(route_tab, attrs \\ %{}) do
    route_tab
    |> cast(attrs, [
      :id,
      :user_id,
      :preset_name,
      :selected_route_ids,
      :ladder_directions,
      :ladder_crowding_toggles,
      :ordering,
      :save_changes_to_tab_id
    ])
    |> validate_required([
      :selected_route_ids,
      :ladder_directions,
      :ladder_crowding_toggles
    ])
  end
end
