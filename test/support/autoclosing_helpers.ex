defmodule Test.Support.AutoclosingHelpers do
  @moduledoc false

  import ExUnit.Callbacks, only: [on_exit: 1]
  import Test.Support.Helpers

  def setup_test_group() do
    test_group_name = Skate.Detours.Autoclosing.test_group_name()

    with {:ok, test_group} <- Skate.Settings.TestGroup.create(test_group_name),
         %Skate.Settings.TestGroup{override: :enabled} <-
           Skate.Settings.TestGroup.update(%{
             test_group
             | override: :enabled
           }) do
      :ok
    else
      _ -> :error
    end
  end

  def setup_feature_flag() do
    feature_flag_name = Skate.Detours.Autoclosing.feature_flag_name()

    reassign_env(:skate, feature_flag_name, "on")

    :ok
  end
end
