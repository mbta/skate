defmodule SkateWeb.LocationSearchControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Skate.LocationSearch.SearchResult

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
      result = %SearchResult{
        id: "test_id",
        name: "Landmark",
        address: "123 Fake St",
        latitude: 0,
        longitude: 0
      }

      reassign_env(:skate, :location_search_fn, fn _query -> {:ok, %{status_code: 200}} end)

      reassign_env(:skate, :location_parse_fn, fn _query -> [result] end)

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

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
