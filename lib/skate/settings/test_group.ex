defmodule Skate.Settings.TestGroup do
  @moduledoc false

  alias Skate.Settings.Db.TestGroup, as: DbTestGroup
  alias Skate.Settings.Db.TestGroupUser, as: DbTestGroupUser
  alias Skate.Settings.Db.User, as: DbUser

  import Ecto.Query, only: [from: 2]

  @type t() :: %__MODULE__{
          id: integer(),
          name: String.t(),
          users: [DbUser.t()]
        }

  @enforce_keys [:id, :name, :users, :override]

  defstruct [:id, :name, users: [], override: :none]

  @spec create(String.t()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def create(name) do
    %DbTestGroup{}
    |> DbTestGroup.changeset(%{name: String.trim(name)})
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

  @spec get_override_enabled() :: [t()]
  def get_override_enabled() do
    from(tg in DbTestGroup, where: tg.override == :enabled)
    |> Skate.Repo.all()
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

  require Logger

  @spec get_by_name(binary()) :: t() | nil
  def get_by_name(name) do
    test_group = DbTestGroup |> Skate.Repo.get_by(name: name) |> Skate.Repo.preload(:users)

    if test_group do
      convert_from_db_test_group(test_group)
    else
      nil
    end
  end

  @spec convert_from_db_test_group(DbTestGroup.t()) :: __MODULE__.t()
  defp convert_from_db_test_group(db_test_group) do
    %__MODULE__{
      id: db_test_group.id,
      name: db_test_group.name,
      users: db_test_group.users,
      override: db_test_group.override
    }
  end

  @doc """
  Deletes a test group with the given ID
  """
  @spec delete(integer()) :: nil
  def delete(id) do
    Skate.Repo.delete(%DbTestGroup{id: id})
  end

  @spec add_user(t(), integer() | nil) :: :ok | :error
  def add_user(test_group, user_id)

  def add_user(%__MODULE__{id: id} = _test_group, user_id) when is_integer(user_id) do
    with %DbUser{} = user <- Skate.Repo.get(DbUser, user_id),
         %DbTestGroup{} = test_group <- Skate.Repo.get(DbTestGroup, id),
         {:ok, %DbTestGroupUser{} = _} <-
           Skate.Repo.insert(%DbTestGroupUser{test_group: test_group, user: user}) do
      :ok
    else
      _ -> :error
    end
  end

  def add_user(_test_group, nil), do: :error

  @spec remove_user(t(), integer() | nil) :: :ok | :error
  def remove_user(test_group, user_id)

  def remove_user(%__MODULE__{} = test_group, user_id) when is_integer(user_id) do
    with %DbTestGroupUser{} = relationship <-
           Skate.Repo.get_by(DbTestGroupUser,
             test_group_id: test_group.id,
             user_id: user_id
           ),
         {:ok, %DbTestGroupUser{} = _} <-
           Skate.Repo.delete(relationship) do
      :ok
    else
      _ -> :error
    end
  end

  def remove_user(_test_group, nil), do: :error

  @spec contains_user?(t(), integer() | nil) :: boolean()
  def contains_user?(test_group, user_id)

  def contains_user?(%__MODULE__{} = test_group, user_id) when is_integer(user_id) do
    Skate.Repo.exists?(
      from(
        relationship in DbTestGroupUser,
        where:
          relationship.test_group_id == ^test_group.id and
            relationship.user_id == ^user_id
      )
    )
  end

  def contains_user?(_test_group, nil), do: false
end
