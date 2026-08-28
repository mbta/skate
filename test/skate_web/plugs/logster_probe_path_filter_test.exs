defmodule SkateWeb.Plugs.LogsterProbePathFilterTest do
  use ExUnit.Case, async: true

  import ExUnit.CaptureLog

  alias SkateWeb.Plugs.LogsterProbePathFilter

  test "sets logster log level to info for exact probe paths" do
    for path <- [
          "/apple-touch-icon-precomposed.png",
          "/apple-touch-icon.png",
          "/login/.git/config"
        ] do
      conn =
        :get
        |> Plug.Test.conn(path)
        |> Logster.Plugs.Logger.call([])
        |> LogsterProbePathFilter.call([])
        |> Plug.Conn.send_resp(200, "")

      assert conn.private.logster_log_level == :info
    end
  end

  test "sets logster log level to info for exploit paths that return 400" do
    for path <- [
          "/cms/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
          "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php"
        ] do
      conn =
        :get
        |> Plug.Test.conn(path)
        |> Logster.Plugs.Logger.call([])
        |> LogsterProbePathFilter.call([])
        |> Plug.Conn.send_resp(400, "")

      assert conn.private.logster_log_level == :info
    end
  end

  test "does not override log level for non-probe paths" do
    conn =
      :get
      |> Plug.Test.conn("/api/routes")
      |> LogsterProbePathFilter.call([])

    refute Map.has_key?(conn.private, :logster_log_level)
  end

  test "sets logster log level to error when a probe path returns 200" do
    path = "/cms/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php"

    log =
      capture_log([level: :info], fn ->
        :get
        |> Plug.Test.conn(path)
        |> Logster.Plugs.Logger.call([])
        |> LogsterProbePathFilter.call([])
        |> Plug.Conn.send_resp(200, "")
      end)

    assert log =~ "[error]"
    assert log =~ "status=200"
    assert log =~ "path=#{path}"
    refute log =~ "[info]"
  end
end
