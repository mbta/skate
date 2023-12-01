defmodule Skate.Settings.Db.RouteTab do
  @moduledoc false

  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  @type t :: %__MODULE__{}

  @primary_key {:uuid, :binary_id, autogenerate: false}

  schema "route_tabs" do
    belongs_to(:user, User)
    field(:preset_name, :string)
    field(:selected_route_ids, {:array, :string})
    field(:ladder_directions, :map)
    field(:ladder_crowding_toggles, :map)
    field(:ordering, :integer)
    field(:is_current_tab, :boolean)

    belongs_to(
      :save_changes_to_tab,
      Skate.Settings.Db.RouteTab,
      foreign_key: :save_changes_to_tab_uuid,
      references: :uuid,
      type: :binary_id
    )

    timestamps()
  end

  def changeset(route_tab, attrs \\ %{}) do
    route_tab
    |> cast(attrs, [
      :uuid,
      :user_id,
      :preset_name,
      :selected_route_ids,
      :ladder_directions,
      :ladder_crowding_toggles,
      :ordering,
      :is_current_tab,
      :save_changes_to_tab_uuid
    ])
    |> cast_assoc(:save_changes_to_tab)
    |> validate_required([
      :selected_route_ids,
      :ladder_directions,
      :ladder_crowding_toggles
    ])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:save_changes_to_tab_uuid)
  end
end
