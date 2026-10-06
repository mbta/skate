defmodule Test.Support.AutoclosingHelpers do
  @moduledoc false

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
end
