defmodule SkateWeb.DetourRouteControllerTest do
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use SkateWeb.ConnCase

  import Mox

  setup :verify_on_exit!

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "directions" do
    defp directions_json(coordinates: coordinates) do
      %{
        "features" => [
          %{
            "geometry" => %{"coordinates" => coordinates},
            "properties" => %{
              "segments" =>
                case length(coordinates) do
                  0..1 ->
                    []

                  len ->
                    Enum.map(1..(len - 1), fn index ->
                      %{
                        "steps" => [
                          %{
                            "instruction" => "Turn right onto #{index}",
                            "name" => to_string(index),
                            "type" => 1
                          }
                        ]
                      }
                    end)
                end
            }
          }
        ]
      }
    end

    @tag :authenticated
    test "returns shape data as geojson", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok, directions_json(coordinates: [[0, 0], [0.5, 0.5], [1, 1]])}
      end)

      conn =
        post(conn, ~p"/api/detours/directions",
          coordinates: [%{"lat" => 0, "lon" => 0}, %{"lat" => 1, "lon" => 1}]
        )

      assert %{
               "data" => %{
                 "coordinates" => [
                   %{"lat" => 0, "lon" => 0},
                   %{"lat" => 0.5, "lon" => 0.5},
                   %{"lat" => 1, "lon" => 1}
                 ]
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "returns directions as a flat list", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok, directions_json(coordinates: [[0, 0], [0.25, 0.25], [0.75, 0.75], [1, 1]])}
      end)

      conn =
        post(conn, ~p"/api/detours/directions",
          coordinates: [%{"lat" => 0, "lon" => 0}, %{"lat" => 1, "lon" => 1}]
        )

      assert %{
               "data" => %{
                 "directions" => [
                   %{"name" => "1", "type" => "right"},
                   %{"name" => "2", "type" => "right"},
                   %{"name" => "3", "type" => "right"}
                 ]
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "formats input coordinates as [lon, lat]", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn request ->
        assert %DirectionsRequest{coordinates: [[100, 1], [101, 2]]} = request

        {:ok, directions_json(coordinates: [[0, 0], [0.5, 0.5], [1, 1]])}
      end)

      post(conn, ~p"/api/detours/directions",
        coordinates: [%{"lat" => 1, "lon" => 100}, %{"lat" => 2, "lon" => 101}]
      )
    end

    @tag :authenticated
    test "interprets output coordinates as [lon, lat]", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok, directions_json(coordinates: [[100, 0], [101, 1]])}
      end)

      conn =
        post(conn, ~p"/api/detours/directions",
          coordinates: [%{"lat" => 1, "lon" => 100}, %{"lat" => 2, "lon" => 101}]
        )

      assert %{
               "data" => %{
                 "coordinates" => [
                   %{"lat" => 0, "lon" => 100},
                   %{"lat" => 1, "lon" => 101}
                 ]
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "returns an empty list when the input has no waypoints", %{conn: conn} do
      conn =
        post(conn, ~p"/api/detours/directions", coordinates: [])

      assert %{
               "data" => %{
                 "coordinates" => [],
                 "directions" => []
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "returns an empty list when the input only has one waypoint", %{conn: conn} do
      conn =
        post(conn, ~p"/api/detours/directions", coordinates: [%{"lat" => 1, "lon" => 100}])

      assert %{
               "data" => %{
                 "coordinates" => [],
                 "directions" => []
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "returns a 500-level response if there is an error", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:error, "nope"}
      end)

      conn =
        post(conn, ~p"/api/detours/directions",
          coordinates: [%{"lat" => 1, "lon" => 100}, %{"lat" => 2, "lon" => 101}]
        )

      assert json_response(conn, 500)
    end
  end
end
