defmodule Skate.Settings.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.UserSettings

  @type t :: %__MODULE__{}

  schema "users" do
    field(:username, :string)
    has_one(:user_settings, UserSettings)
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
