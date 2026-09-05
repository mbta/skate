defmodule SkateWeb.Plugs.BlockScannerRequestsTest do
  use ExUnit.Case, async: true

  alias SkateWeb.Plugs.BlockScannerRequests

  test "halts and returns 404 for PHP file probes" do
    conn = call_with_path("/index.php")

    assert conn.halted
    assert conn.status == 404
  end

  test "halts and returns 404 for wordpress paths" do
    conn = call_with_path("/wp-login.php")

    assert conn.halted
    assert conn.status == 404
  end

  test "halts and returns 404 for path traversal in the path" do
    conn = call_with_path("/../../../../etc/passwd")

    assert conn.halted
    assert conn.status == 404
  end

  test "halts and returns 404 for path traversal in the query string" do
    conn = call_with_path("/index.php", "page=../../../../boot.ini")

    assert conn.halted
    assert conn.status == 404
  end

  test "passes through normal requests" do
    conn = call_with_path("/")

    refute conn.halted
  end

  defp call_with_path(path, query_string \\ "") do
    :get
    |> Plug.Test.conn(path <> if(query_string == "", do: "", else: "?#{query_string}"))
    |> BlockScannerRequests.call(BlockScannerRequests.init([]))
  end
end
