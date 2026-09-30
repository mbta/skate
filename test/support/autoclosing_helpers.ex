defmodule Test.Support.AutoclosingHelpers do
  @moduledoc false
  alias Skate.Repo
  alias Skate.Settings.Db.TestGroupUser, as: TestGroupUsers
  alias Skate.Settings.TestGroup
  alias Skate.Settings.TestGroupOverride
  alias Skate.Settings.User

  import Ecto.Query
  import ExUnit.Callbacks, only: [on_exit: 1]
  import Test.Support.Helpers

  @spec setup_test_group(TestGroupOverride.t()) :: :ok | :error
  def setup_test_group(override \\ :enabled) do
    test_group_name = Skate.Detours.Autoclosing.test_group_name()

    with {:ok, %TestGroup{} = test_group} <- TestGroup.create(test_group_name),
         %TestGroup{} = _ <- TestGroup.update(%{test_group | override: override}) do
      :ok
    else
      _ -> :error
    end
  end

  @spec update_test_group_override(TestGroupOverride.t()) :: :ok | :error
  def update_test_group_override(override) do
    test_group_name = Skate.Detours.Autoclosing.test_group_name()

    with test_group when not is_nil(test_group) <-
           TestGroup.get_by_name(test_group_name),
         %TestGroup{} = _ <- TestGroup.update(%{test_group | override: override}) do
      :ok
    else
      _ -> :error
    end
  end

  @spec add_test_group_user(integer() | nil) :: :ok | :error
  def add_test_group_user(user_id)

  def add_test_group_user(user_id) when is_integer(user_id) do
    test_group_name = Skate.Detours.Autoclosing.test_group_name()

    with test_group when not is_nil(test_group) <-
           TestGroup.get_by_name(test_group_name),
         user when not is_nil(user) <- User.get_by_id(user_id),
         user_already_in_group? <-
           Repo.exists?(
             from test_group_user in TestGroupUsers,
               where:
                 test_group_user.user_id == ^user.id and
                   test_group_user.test_group_id == ^test_group.id
           ) do
      if user_already_in_group? do
        :ok
      else
        case Repo.insert(%TestGroupUsers{user_id: user.id, test_group_id: test_group.id}) do
          {:ok, _} -> :ok
          _ -> :error
        end
      end
    else
      _ -> :error
    end
  end

  def add_test_group_user(nil), do: :ok

  @spec setup_feature_flag(binary() | nil) :: :ok
  def setup_feature_flag(value \\ "on") do
    feature_flag_name = Skate.Detours.Autoclosing.feature_flag_name()

    reassign_env(:skate, feature_flag_name, value)

    :ok
  end
end
