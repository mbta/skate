defmodule Gtfs.HealthServerTest do
  use ExUnit.Case

  alias Gtfs.HealthServer

  test "becomes ready after calling loaded" do
    pid = HealthServer.start_mocked()
    refute HealthServer.ready?(pid)
    HealthServer.loaded(pid)
    assert HealthServer.ready?(pid)
  end

  test "gtfs server tells the health server it's loaded" do
    health_server_pid = HealthServer.start_mocked()
    refute HealthServer.ready?(health_server_pid)
    gtfs_pid = Gtfs.start_mocked(%{}, health_server_pid)
    # Make a synchronous call to make sure the data is loaded
    Gtfs.all_routes(gtfs_pid)
    assert HealthServer.ready?(health_server_pid)
  end

  test "real gtfs server uses the default health server" do
    # The real data takes longer to load than the tests take to run
    refute HealthServer.ready?(HealthServer.default_server())
  end
end
