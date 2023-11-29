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

  @spec create(String.t()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def create(name) do
    %DbTestGroup{}
    |> DbTestGroup.changeset(%{name: name})
    |> Skate.Repo.insert()
    |> case do
      {:ok, new_test_group} ->
        {:ok,
         new_test_group
         |> Skate.Repo.preload(:users)
         |> convert_from_db_test_group()}

      {:error, errored_changeset} ->
        {:error, errored_changeset}
    end
  end

  @spec get(integer()) :: t() | nil
  def get(id) do
    test_group = DbTestGroup |> Skate.Repo.get(id) |> Skate.Repo.preload(:users)

    if test_group do
      convert_from_db_test_group(test_group)
    else
      nil
    end
  end

  @spec get_all() :: [t()]
  def get_all() do
    DbTestGroup
    |> Skate.Repo.all()
    |> Skate.Repo.preload(:users)
    |> Enum.map(&convert_from_db_test_group(&1))
  end

  @spec update(t()) :: t()
  def update(test_group) do
    existing_test_group =
      DbTestGroup |> Skate.Repo.get!(test_group.id) |> Skate.Repo.preload(:test_group_users)

    existing_user_id_lookup = Map.new(existing_test_group.test_group_users, &{&1.user_id, &1.id})

    existing_test_group
    |> DbTestGroup.changeset(
      test_group
      |> Map.from_struct()
      |> Map.put(
        :test_group_users,
        Enum.map(test_group.users, fn user ->
          id = Map.get(existing_user_id_lookup, user.id)
          %{id: id, user_id: user.id, test_group_id: existing_test_group.id}
        end)
      )
      |> Map.delete(:users)
    )
    |> Skate.Repo.update!()
    |> Skate.Repo.preload(:users)
    |> convert_from_db_test_group()
  end

  @spec convert_from_db_test_group(DbTestGroup.t()) :: __MODULE__.t()
  defp convert_from_db_test_group(db_test_group) do
    %__MODULE__{
      id: db_test_group.id,
      name: db_test_group.name,
      users: db_test_group.users
    }
  end

  @doc """
  Deletes a test group with the given ID
  """
  @spec delete(integer()) :: nil
  def delete(id) do
    Skate.Repo.delete(%DbTestGroup{id: id})
  end
end
