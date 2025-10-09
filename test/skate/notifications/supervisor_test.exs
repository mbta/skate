defmodule Skate.Notifications.SupervisorTest do
  use ExUnit.Case, async: true

  alias Skate.Notifications.Supervisor

  describe "start_link/1" do
    test "can start the application" do
      assert {:ok, _pid} = Supervisor.start_link([])
    end
  end
end
