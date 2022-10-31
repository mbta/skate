defmodule Skate.Settings.Db.TestGroupUser do
  use Ecto.Schema

  alias Skate.Settings.Db.TestGroup, as: DbTestGroup
  alias Skate.Settings.Db.User, as: DbUser

  @type t() :: %__MODULE__{}

  schema "test_groups_users" do
    belongs_to(:test_group, DbTestGroup)
    belongs_to(:user, DbUser)
    timestamps()
  end
end
