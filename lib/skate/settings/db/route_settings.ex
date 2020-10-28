defmodule Skate.Settings.Db.RouteSettings do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  @primary_key false

  @type t :: %__MODULE__{}

  schema "route_settings" do
    belongs_to(:user, User, primary_key: true)
    field(:selected_route_ids, {:array, :string})
    field(:ladder_directions, :map)
    field(:ladder_crowding_toggles, :map)
    timestamps()
  end

  def changeset(route_settings, attrs \\ %{}) do
    route_settings
    |> cast(attrs, [:user_id, :selected_route_ids, :ladder_directions, :ladder_crowding_toggles])
    |> validate_required([
      :user_id,
      :selected_route_ids,
      :ladder_directions,
      :ladder_crowding_toggles
    ])
  end
end
