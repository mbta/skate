defmodule Realtime.AlertsFetcherTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import ExUnit.CaptureLog
  alias Realtime.AlertsFetcher

  @api_response %{
    "data" => [
      %{
        "attributes" => %{
          "informed_entity" => [
            %{"route" => "1"}
          ],
          "effect" => "DETOUR",
          "service_effect" => "Route 1 detour"
        },
        "type" => "alert",
        "id" => 123
      }
    ]
  }

  @complex_api_response %{
    "data" => [
      %{
        "attributes" => %{
          "informed_entity" => [
            %{"route" => "1"},
            %{"route" => "1"},
            %{"route" => "2"}
          ],
          "effect" => "DETOUR",
          "service_effect" => "Route 1 and 2 detour"
        },
        "type" => "alert",
        "id" => 123
      },
      %{
        "attributes" => %{
          "informed_entity" => [
            %{"route" => "2"}
          ],
          "effect" => "DETOUR",
          "service_effect" => "Different route 2 detour"
        },
        "type" => "alert",
        "id" => 456
      },
      %{
        "attributes" => %{
          "informed_entity" => [
            %{"route" => "1"}
          ],
          "effect" => "UNKNOWN_EFFECT",
          "service_effect" => "Non-detour alert"
        },
        "type" => "alert",
        "id" => 789
      }
    ]
  }

  setup tags do
    if tags[:mock_api] do
      bypass = Bypass.open()
      api_url = "http://localhost:#{bypass.port}/"
      reassign_env(:skate, :api_url, api_url)

      %{bypass: bypass}
    else
      :ok
    end
  end

  describe "start_link/1" do
    @tag :mock_api
    test "starts GenServer", %{bypass: bypass} do
      Bypass.stub(bypass, "GET", "/alerts", fn _ ->
        Bypass.pass(bypass)
      end)

      assert {:ok, _pid} = AlertsFetcher.start_link(update_fn: fn _ -> :ok end)
    end
  end

  describe "init/1" do
    test "sets state and queues up initial check" do
      api_url = "https://test.com/"
      api_key = "test_key"
      reassign_env(:skate, :api_url, api_url)
      reassign_env(:skate, :api_key, api_key)

      update_fn = fn _ -> :ok end

      assert {:ok,
              %{
                update_fn: ^update_fn,
                poll_interval_ms: 500,
                api_url: ^api_url,
                api_key: ^api_key
              },
              {:continue, :initial_poll}} =
               AlertsFetcher.init(update_fn: update_fn, poll_interval_ms: 500)
    end
  end

  describe "handle_continue/2" do
    @tag :mock_api
    test "fetches alerts", %{bypass: bypass} do
      test_pid = self()

      update_fn = fn alerts ->
        GenServer.cast(test_pid, alerts)
        :ok
      end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(@api_response))
      end)

      assert {:noreply, _state} = AlertsFetcher.handle_continue(:initial_poll, state)

      assert_receive {:"$gen_cast", %{"1" => ["Route 1 detour"]}}, 5000
    end
  end

  describe "handle_info/2" do
    @tag :mock_api
    test "fetches alerts and logs on success", %{bypass: bypass} do
      set_log_level(:info)
      test_pid = self()

      update_fn = fn alerts ->
        GenServer.cast(test_pid, alerts)
        :ok
      end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(@api_response))
      end)

      log =
        capture_log([level: :info], fn ->
          assert {:noreply, _state} = AlertsFetcher.handle_info(:query_api, state)
        end)

      assert_receive {:"$gen_cast", %{"1" => ["Route 1 detour"]}}, 5000

      assert log =~ "updated_alerts"
    end

    @tag :mock_api
    test "handles unsuccessful HTTP request", %{bypass: bypass} do
      update_fn = fn _ -> :ok end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 500, "server error")
      end)

      log =
        capture_log([level: :warning], fn ->
          assert {:noreply, _state} = AlertsFetcher.handle_info(:query_api, state)
        end)

      assert log =~ "unexpected_response"
    end

    @tag :mock_api
    test "handles malformed response", %{bypass: bypass} do
      update_fn = fn _ -> :ok end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, "bad json")
      end)

      log =
        capture_log([level: :warning], fn ->
          assert {:noreply, _state} = AlertsFetcher.handle_info(:query_api, state)
        end)

      assert log =~ "unable_to_parse_alerts"
    end

    @tag :mock_api
    test "handles multiple alerts per route, multiple routes per alert, and non-detour alerts", %{
      bypass: bypass
    } do
      set_log_level(:info)
      test_pid = self()

      update_fn = fn alerts ->
        GenServer.cast(test_pid, alerts)
        :ok
      end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(@complex_api_response))
      end)

      log =
        capture_log([level: :info], fn ->
          assert {:noreply, _state} = AlertsFetcher.handle_info(:query_api, state)
        end)

      assert_receive {:"$gen_cast",
                      %{
                        "1" => ["Route 1 and 2 detour"],
                        "2" => ["Different route 2 detour", "Route 1 and 2 detour"]
                      }},
                     5000

      assert log =~ "updated_alerts"
    end
  end
end
