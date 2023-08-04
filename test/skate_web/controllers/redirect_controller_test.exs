defmodule SkateWeb.RedirectTest do
  use ExUnit.Case, async: true

  alias SkateWeb.Redirect

  defmodule Router do
    use Phoenix.Router

    get "/1", Redirect, external: "https://test-site-1"
    get "/1/2", Redirect, external: "https://test-site-2"
    get "/exceptional", Redirect, []
  end

  test "an exception is raised when `external` isn't defined" do
    assert_raise Plug.Conn.WrapperError, ~R[Missing required external: option in redirect], fn ->
      call(Router, :get, "/exceptional")
    end
  end

  test "ignores query parameters" do
    # Test that a route without a `:external` parameter doesn't pull `external` from query parameter
    assert_raise Plug.Conn.WrapperError, ~R[Missing required external: option in redirect], fn ->
      call(Router, :get, "/exceptional?external=https://bad-url")
    end

    # Test that a route with a `:external` parameter doesn't redirect to a `external` query parameter
    conn = call(Router, :get, "/1?external=https://bad-url")

    assert Phoenix.ConnTest.redirected_to(conn) == "https://test-site-1"
  end

  test "route redirected to external route" do
    conn = call(Router, :get, "/1")

    assert Phoenix.ConnTest.redirected_to(conn) == "https://test-site-1"
  end

  test "nested route redirected to external route" do
    conn = call(Router, :get, "/1/2")

    assert Phoenix.ConnTest.redirected_to(conn) == "https://test-site-2"
  end

  defp call(router, verb, path) do
    verb
    |> Plug.Test.conn(path)
    |> router.call(router.init([]))
  end
end
