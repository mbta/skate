defmodule GeonamesTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import ExUnit.CaptureLog
  import Plug.Conn

  alias Geonames

  @json %{
    "credits" => "1.0",
    "intersection" => %{
      "mtfcc1" => "S1400",
      "mtfcc2" => "S1400",
      "adminCode1" => "CA",
      "lng" => "-122.180842",
      "distance" => "0.08",
      "bearing" => "242",
      "placename" => "Menlo Park",
      "street1Bearing" => "213",
      "street2Bearing" => "303",
      "adminName2" => "San Mateo",
      "postalcode" => "94025",
      "countryCode" => "US",
      "street1" => "Roble Ave",
      "street2" => "Curtis St",
      "adminName1" => "California",
      "lat" => "37.450649"
    }
  }

  describe "nearest_intersection" do
    test "returns nil if the request fails and logs" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      log =
        capture_log(fn ->
          Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 500, "") end)

          assert Geonames.nearest_intersection("0.0", "0.0") == nil
        end)

      assert log =~ "unexpected_response"
    end

    test "passes all query params" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")
      reassign_env(:skate, :geonames_token, "TOKEN")

      Bypass.expect(bypass, fn conn ->
        conn = Plug.Conn.fetch_query_params(conn)
        assert conn.params["lat"] == "40.0"
        assert conn.params["lng"] == "-70.0"
        assert conn.params["username"] == "mbta_busloc"
        assert conn.params["token"] == "TOKEN"
        Plug.Conn.resp(conn, 200, "{}")
      end)

      assert Geonames.nearest_intersection("40.0", "-70.0") == nil
    end

    test "parses the street names out and logs success" do
      set_log_level(:info)

      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      log =
        capture_log(
          [level: :info],
          fn ->
            Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(@json)) end)
            assert Geonames.nearest_intersection("40", "-70") == "Roble Ave & Curtis St"
          end
        )

      assert log =~ "got_intersection_response"
    end

    test "retries request on failure" do
      set_log_level(:info)

      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      {:ok, agent} = response_agent()

      agent
      |> add_response(fn conn ->
        send_resp(conn, 500, "")
      end)
      |> add_response(fn conn ->
        send_resp(conn, 200, Jason.encode!(@json))
      end)

      log =
        capture_log(
          [level: :info],
          fn ->
            Bypass.expect(bypass, fn conn -> agent_response(agent, conn) end)

            assert Geonames.nearest_intersection("40", "-70") == "Roble Ave & Curtis St"
          end
        )

      assert log =~ "retry=true"
      assert log =~ "got_intersection_response"
    end

    test "only retries request once" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      {:ok, agent} = response_agent()

      agent
      |> add_response(fn conn ->
        send_resp(conn, 500, "")
      end)
      |> add_response(fn conn ->
        send_resp(conn, 500, "")
      end)
      |> add_response(fn conn ->
        send_resp(conn, 200, Jason.encode!(@json))
      end)

      log =
        capture_log(fn ->
          Bypass.expect(bypass, fn conn -> agent_response(agent, conn) end)

          assert Geonames.nearest_intersection("40", "-70") == nil
        end)

      assert log =~ "unexpected_response"
      assert log =~ "retry=true"
      assert log =~ "retry=false"
    end

    test "returns nil if there is no nearby intersection" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      empty_json = %{
        "credits" => "1.0"
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(empty_json)) end)
      assert Geonames.nearest_intersection("40", "-70") == nil
    end
  end

  defp response_agent do
    Agent.start_link(fn -> [] end)
  end

  defp add_response(agent, fun) do
    :ok = Agent.update(agent, fn funs -> funs ++ [fun] end)
    agent
  end

  defp agent_response(agent, conn) do
    fun =
      Agent.get_and_update(agent, fn
        [] -> {&default_response/1, []}
        [fun | funs] -> {fun, funs}
      end)

    fun.(conn)
  end

  defp default_response(conn) do
    send_resp(conn, 200, "agent")
  end
end
