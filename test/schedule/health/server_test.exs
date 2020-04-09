defmodule Schedule.Health.ServerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Schedule.Health

  test "becomes ready after calling loaded and checker reports healthy" do
    reassign_env(:skate, :checker_healthy_fn, fn -> true end)

    pid = Health.Server.start_mocked()
    refute Health.Server.ready?(pid)
    Health.Server.loaded(pid)

    assert Health.Server.ready?(pid)
  end

  test "not ready after calling loaded if checker reports not healthy" do
    reassign_env(:skate, :checker_healthy_fn, fn -> false end)

    pid = Health.Server.start_mocked()
    Health.Server.loaded(pid)
    refute Health.Server.ready?(pid)
  end

  test "gtfs server tells the health server it's loaded" do
    reassign_env(:skate, :checker_healthy_fn, fn -> true end)
    health_server_pid = Health.Server.start_mocked()
    refute Health.Server.ready?(health_server_pid)
    gtfs_pid = Schedule.start_mocked(%{}, health_server_pid)
    # Make a synchronous call to make sure the data is loaded
    Schedule.all_routes(gtfs_pid)
    assert Health.Server.ready?(health_server_pid)
  end

  test "can start in supervision tree with default name" do
    start_supervised({Schedule.Health.Server, []})
    # No Schedule server points to this health server, so it won't be ready
    refute Health.Server.ready?(Health.Server.default_server())
  end
end
