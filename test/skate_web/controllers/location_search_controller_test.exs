defmodule SkateWeb.LocationSearchControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Skate.LocationSearch.Place
  alias Skate.LocationSearch.Suggestion

  describe "GET /api/location_search/search" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/location_search/search?query=test")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "returns data", %{conn: conn} do
      result = %Place{
        id: "test_id",
        name: "Landmark",
        address: "123 Fake St",
        latitude: 0,
        longitude: 0
      }

      reassign_env(:skate, :location_search_fn, fn _query -> {:ok, [result]} end)

      conn =
        conn
        |> api_headers()
        |> get("/api/location_search/search?query=test")

      assert json_response(conn, 200) == %{
               "data" => [
                 result
                 |> Map.from_struct()
                 |> Map.new(fn {key, value} -> {Atom.to_string(key), value} end)
               ]
             }
    end
  end

  describe "GET /api/location_search/suggest" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/location_search/suggest?query=test")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "returns data", %{conn: conn} do
      result = %Suggestion{text: "suggested search", place_id: nil}

      reassign_env(:skate, :location_suggest_fn, fn _query -> {:ok, [result]} end)

      conn =
        conn
        |> api_headers()
        |> get("/api/location_search/suggest?query=test")

      assert json_response(conn, 200) == %{
               "data" => [%{"text" => "suggested search", "place_id" => nil}]
             }
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
