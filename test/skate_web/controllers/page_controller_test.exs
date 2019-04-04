defmodule SkateWeb.PageControllerTest do
  use SkateWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "div id=\"app\""
  end
end
