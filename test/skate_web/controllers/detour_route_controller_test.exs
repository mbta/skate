defmodule SkateWeb.DetourRouteControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "directions" do
    setup do
      bypass = Bypass.open()

      reassign_env(:skate, Skate.OpenRouteServiceAPI,
        api_base_url: "http://localhost:#{bypass.port}"
      )

      %{bypass: bypass}
    end

    @tag :authenticated
    test "returns shape data as geojson", %{conn: conn, bypass: bypass} do
      Bypass.expect(bypass, fn conn ->
        assert %Plug.Conn{
                 request_path: "/v2/directions/driving-hgv/geojson",
                 method: "POST"
                 #  req_headers: [{"authorization", "nil"}, {"content-type", "application/json"}]
               } =
                 dbg(conn)

        Plug.Conn.resp(conn, 200, Jason.encode!(%{success: true}))
      end)

      conn = post(conn, ~p"/api/routing/directions", coordinates: [[0, 0], [1, 1]])
      assert %{"data" => %{"success" => true}} = json_response(conn, 200)
    end

    # Forwards other errors
    # test "400 The request is incorrect and therefore can not be processed."
    # test "500 An unexpected error was encountered and a more detailed error code is provided."
    # test "503 The server is currently unavailable due to overload or maintenance."
  end
end
