defmodule Skate.Settings.Db.TestGroup do
  @moduledoc false

  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.TestGroupUser, as: DbTestGroupUser
  alias Skate.Settings.TestGroupOverride

  @type t() :: %__MODULE__{}

  schema "test_groups" do
    field(:name, :string)
    field(:override, TestGroupOverride, default: :none)
    timestamps()

    has_many(:test_group_users, DbTestGroupUser, on_replace: :delete_if_exists)
    has_many(:users, through: [:test_group_users, :user])
  end

  def changeset(test_group, attrs \\ %{}) do
    test_group
    |> cast(attrs, [:name, :override])
    |> cast_assoc(:test_group_users)
    |> validate_required([:name])
    |> unique_constraint(:name, name: :test_groups_unique_index)
  end
end
