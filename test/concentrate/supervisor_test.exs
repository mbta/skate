defmodule Concentrate.SupervisorTest do
  @moduledoc false
  use ExUnit.Case

  describe "start_link/0" do
    test "can start the application" do
      Application.ensure_all_started(:concentrate)

      on_exit(fn ->
        Application.stop(:concentrate)
      end)
    end
  end
end
