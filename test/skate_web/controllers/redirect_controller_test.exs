defmodule SkateWeb.RedirectTest do
  use ExUnit.Case, async: true

  alias SkateWeb.Redirect

  defmodule Router do
    use Phoenix.Router

    get "/valid", Redirect, external: :aup
    get "/valid/nested", Redirect, external: :aup
    get "/invalid", Redirect, external: :invalid
    get "/exceptional", Redirect, []
  end

  test "an exception is raised when `external` isn't defined" do
    assert_raise Plug.Conn.WrapperError, ~R[Missing required external: option in redirect], fn ->
      call(Router, :get, "/exceptional")
    end
  end

  test "route redirected to external route" do
    conn = call(Router, :get, "/valid")

    assert Phoenix.ConnTest.redirected_to(conn) ==
             Application.get_env(:skate, :acceptable_use_policy)
  end

  test "nested route redirected to external route" do
    conn = call(Router, :get, "/valid/nested")

    assert Phoenix.ConnTest.redirected_to(conn) ==
             Application.get_env(:skate, :acceptable_use_policy)
  end

  test "when atom is not in allow list, should return :not_found" do
    conn = call(Router, :get, "/invalid")

    assert Phoenix.ConnTest.response(conn, :not_found) == "URL not found"
  end

  defp call(router, verb, path) do
    verb
    |> Plug.Test.conn(path)
    |> router.call(router.init([]))
  end
end
