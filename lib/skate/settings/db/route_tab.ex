defmodule Skate.Settings.Db.RouteTab do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.{TabSettings, User}

  @type t :: %__MODULE__{}

  schema "route_tabs" do
    belongs_to(:user, User)
    has_one(:tab_settings, TabSettings, on_replace: :update)
    field(:preset_name, :string)
    field(:ordering, :integer)
    field(:is_current_tab, :boolean)

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
      :ordering,
      :save_changes_to_tab_id,
      :is_current_tab
    ])
    |> put_assoc(
      :tab_settings,
      Map.take(attrs, [:ladder_directions, :ladder_crowding_toggles, :selected_route_ids])
    )
  end
end
