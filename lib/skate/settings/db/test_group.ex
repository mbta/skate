defmodule Skate.Settings.Db.TestGroup do
  use Ecto.Schema

  alias Skate.Settings.Db.TestGroupUser, as: DbTestGroupUser

  @type t() :: %__MODULE__{}

  schema "test_groups" do
    field(:name, :string)
    timestamps()

    has_many(:test_group_users, DbTestGroupUser)
    has_many(:users, through: [:test_group_users, :user])
  end
end
