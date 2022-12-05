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

  describe "start_link/1" do
    test "starts GenServer" do
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
    test "fetches alerts" do
      bypass = Bypass.open()
      api_url = "http://localhost:#{bypass.port}/"
      reassign_env(:skate, :api_url, api_url)
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
    test "fetches alerts and logs on success" do
      set_log_level(:info)
      bypass = Bypass.open()
      api_url = "http://localhost:#{bypass.port}/"
      reassign_env(:skate, :api_url, api_url)
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

    test "handles unsuccessful HTTP request" do
      bypass = Bypass.open()
      api_url = "http://localhost:#{bypass.port}/"
      reassign_env(:skate, :api_url, api_url)

      update_fn = fn _ -> :ok end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 500, "server error")
      end)

      log =
        capture_log([level: :warn], fn ->
          assert {:noreply, _state} = AlertsFetcher.handle_info(:query_api, state)
        end)

      assert log =~ "unexpected_response"
    end

    test "handles malformed response" do
      bypass = Bypass.open()
      api_url = "http://localhost:#{bypass.port}/"
      reassign_env(:skate, :api_url, api_url)

      update_fn = fn _ -> :ok end

      {:ok, state, _} = AlertsFetcher.init(update_fn: update_fn)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, "bad json")
      end)

      log =
        capture_log([level: :warn], fn ->
          assert {:noreply, _state} = AlertsFetcher.handle_info(:query_api, state)
        end)

      assert log =~ "unable_to_parse_alerts"
    end

    test "handles multiple alerts per route, multiple routes per alert, and non-detour alerts" do
      set_log_level(:info)
      bypass = Bypass.open()
      api_url = "http://localhost:#{bypass.port}/"
      reassign_env(:skate, :api_url, api_url)
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
