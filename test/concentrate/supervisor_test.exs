defmodule Concentrate.SupervisorTest do
  @moduledoc false
  use ExUnit.Case
  import Concentrate.Supervisor

  describe "start_link/0" do
    test "can start the application" do
      Application.ensure_all_started(:concentrate)

      on_exit(fn ->
        Application.stop(:concentrate)
      end)
    end
  end

  describe "children/1" do
    test "builds the right number of children" do
      # currently, the right number is 2: pipeline, health
      actual = children([])

      assert length(actual) == 2
    end
  end
end
