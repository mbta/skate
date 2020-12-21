defmodule Skate.Settings.Db.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.RouteSettings
  alias Skate.Settings.Db.UserSettings

  @type t :: %__MODULE__{}

  schema "users" do
    field(:username, :string)
    has_one(:user_settings, UserSettings)
    has_one(:route_settings, RouteSettings)
    timestamps()
  end

  def changeset(user, attrs \\ %{}) do
    user
    |> cast(attrs, [
      :id,
      :username
    ])
    |> validate_required([
      :username
    ])
  end
end
