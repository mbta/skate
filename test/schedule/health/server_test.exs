defmodule Schedule.Health.ServerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Schedule.Health.Server, as: HealthServer

  test "becomes ready after calling loaded and checker reports healthy" do
    reassign_env(:skate, :checker_healthy_fn, fn -> true end)

    pid = HealthServer.start_mocked()
    refute HealthServer.ready?(pid)
    HealthServer.loaded(pid)

    assert HealthServer.ready?(pid)
  end

  test "not ready after calling loaded if checker reports not healthy" do
    reassign_env(:skate, :checker_healthy_fn, fn -> false end)

    pid = HealthServer.start_mocked()
    HealthServer.loaded(pid)
    refute HealthServer.ready?(pid)
  end

  test "gtfs server tells the health server it's loaded" do
    reassign_env(:skate, :checker_healthy_fn, fn -> true end)
    health_server_pid = HealthServer.start_mocked()
    refute HealthServer.ready?(health_server_pid)
    Schedule.start_mocked(%{}, health_server_pid)
    assert HealthServer.ready?(health_server_pid)
  end

  test "can start in supervision tree with default name" do
    start_supervised({HealthServer, []})
    # No Schedule server points to this health server, so it won't be ready
    refute HealthServer.ready?(HealthServer.default_server())
  end
end
