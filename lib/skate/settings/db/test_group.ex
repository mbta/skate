defmodule Skate.Settings.Db.TestGroup do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.TestGroupUser, as: DbTestGroupUser

  @type t() :: %__MODULE__{}

  schema "test_groups" do
    field(:name, :string)
    timestamps()

    has_many(:test_group_users, DbTestGroupUser, on_replace: :delete_if_exists)
    has_many(:users, through: [:test_group_users, :user])
  end

  def changeset(test_group, attrs \\ %{}) do
    test_group
    |> cast(attrs, [:name])
    |> cast_assoc(:test_group_users)
    |> validate_required([:name])
  end
end
