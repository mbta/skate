defmodule Skate.Settings.TestGroup do
  alias Skate.Settings.Db.TestGroup, as: DbTestGroup
  alias Skate.Settings.Db.User, as: DbUser

  @type t() :: %__MODULE__{
          id: integer(),
          name: String.t(),
          users: [DbUser.t()]
        }

  @enforce_keys [:id, :name, :users]

  defstruct [:id, :name, users: []]

  @spec create(name :: String.t()) :: __MODULE__.t()
  def create(name) do
    %DbTestGroup{name: name}
    |> Skate.Repo.insert!()
    |> Skate.Repo.preload(:users)
    |> convert_from_db_test_group()
  end

  @spec get_all() :: [t()]
  def get_all() do
    DbTestGroup
    |> Skate.Repo.all()
    |> Skate.Repo.preload(:users)
    |> Enum.map(&convert_from_db_test_group(&1))
  end

  @spec convert_from_db_test_group(DbTestGroup.t()) :: __MODULE__.t()
  defp convert_from_db_test_group(db_test_group) do
    %__MODULE__{
      id: db_test_group.id,
      name: db_test_group.name,
      users: db_test_group.users
    }
  end
end
