defmodule SkateWeb.Plugs.LogsterProbePathFilterTest do
  use ExUnit.Case, async: true

  alias SkateWeb.Plugs.LogsterProbePathFilter

  test "sets logster log level to info for known scanner probe paths" do
    for path <- [
          "/apple-touch-icon-precomposed.png",
          "/apple-touch-icon.png",
          "/login/.git/config",
          "/cms/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
          "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php"
        ] do
      conn =
        :get
        |> Plug.Test.conn(path)
        |> LogsterProbePathFilter.call([])

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
end
