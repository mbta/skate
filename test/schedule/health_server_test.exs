defmodule Schedule.HealthServerTest do
  use ExUnit.Case

  alias Schedule.HealthServer

  test "becomes ready after calling loaded" do
    pid = HealthServer.start_mocked()
    refute HealthServer.ready?(pid)
    HealthServer.loaded(pid)
    assert HealthServer.ready?(pid)
  end

  test "gtfs server tells the health server it's loaded" do
    health_server_pid = HealthServer.start_mocked()
    refute HealthServer.ready?(health_server_pid)
    gtfs_pid = Schedule.start_mocked(%{}, health_server_pid)
    # Make a synchronous call to make sure the data is loaded
    Schedule.all_routes(gtfs_pid)
    assert HealthServer.ready?(health_server_pid)
  end

  test "can start in supervision tree with default name" do
    start_supervised({Schedule.HealthServer, []})
    # No Schedule server points to this health server, so it won't be ready
    refute HealthServer.ready?(HealthServer.default_server())
  end
end
