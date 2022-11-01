defmodule Skate.Settings.Db.TestGroupUser do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.TestGroup, as: DbTestGroup
  alias Skate.Settings.Db.User, as: DbUser

  @type t() :: %__MODULE__{}

  schema "test_groups_users" do
    belongs_to(:test_group, DbTestGroup)
    belongs_to(:user, DbUser)
    timestamps()
  end

  def changeset(test_group_user, attrs \\ %{}) do
    test_group_user
    |> cast(attrs, [:test_group_id, :user_id])
    |> cast_assoc(:test_group)
    |> cast_assoc(:user)
  end
end
