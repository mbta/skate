defmodule Test.Support.AutoclosingHelpers do
  @moduledoc false
  alias Skate.Settings.TestGroup
  alias Skate.Settings.TestGroupOverride

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

  @spec setup_feature_flag(binary() | nil) :: :ok
  def setup_feature_flag(value \\ "on") do
    feature_flag_name = Skate.Detours.Autoclosing.feature_flag_name()

    reassign_env(:skate, feature_flag_name, value)

    :ok
  end
end
