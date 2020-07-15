defmodule SkateWeb.IntersectionControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias SkateWeb.AuthManager

  describe "GET /api/intersection" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/intersection/?latitude=40&longitude=-70")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "returns data", %{conn: conn} do
      reassign_env(:skate, :intersection_fn, fn _latitude, _longitude ->
        "Sesame St & Electric Avenue"
      end)

      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/intersection/?latitude=40&longitude=-70")

      assert json_response(conn, 200) == %{
               "data" => "Sesame St & Electric Avenue"
             }
    end

    test "gracefully handles geonames api failures", %{conn: conn} do
      reassign_env(:skate, :intersection_fn, fn _latitude, _longitude -> nil end)

      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/intersection/?latitude=40&longitude=-70")

      assert json_response(conn, 200) == %{
               "data" => nil
             }
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end

  defp logged_in(conn) do
    {:ok, token, _} = AuthManager.encode_and_sign(%{})

    put_req_header(conn, "authorization", "bearer: " <> token)
  end
end
