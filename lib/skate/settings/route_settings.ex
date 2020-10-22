defmodule Skate.Settings.RouteSettings do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.User
  alias Skate.Settings.RouteSetting

  @primary_key false

  @type t :: %__MODULE__{}

  schema "route_settings" do
    belongs_to(:user, User, primary_key: true)
    embeds_many(:settings, RouteSetting)
    timestamps()
  end

  def changeset(route_settings, attrs \\ %{}) do
    route_settings
    |> cast(attrs, [:user_id])
    |> cast_embed(:settings)
    |> validate_required([:user_id])
  end
end
