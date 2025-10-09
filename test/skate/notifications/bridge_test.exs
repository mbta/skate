defmodule Skate.Notifications.BridgeTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import Skate.Notifications.Bridge
  import ExUnit.CaptureLog
  alias Skate.Notifications

  describe "init/1" do
    test "issues warning and doesn't start without a host" do
      reassign_env(:skate, :bridge_url, nil)

      log =
        capture_log(fn ->
          :ignore = Notifications.Bridge.init([])
        end)

      assert log =~ "no url configured"
    end
  end

  describe "update" do
    setup do
      reassign_env(:skate, :bridge_url, "http://example.com")
      {:ok, pid} = Notifications.Bridge.start_link([])

      %{pid: pid}
    end

    test "can call update", %{pid: pid} do
      assert Notifications.Bridge.update(pid) == :update
    end
  end

  describe "handle_info/1" do
    setup do
      bypass = Bypass.open()

      reassign_env(:skate, :bridge_api_username, "user")
      reassign_env(:skate, :bridge_api_password, "123")
      reassign_env(:skate, :bridge_url, "http://localhost:#{bypass.port}")

      token_json = %{
        "access_token" => "token",
        "token_type" => "bearer",
        "expires_in" => 2_591_999
      }

      Bypass.stub(bypass, "POST", "token", fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(token_json))
      end)

      init_state = %{token: %{value: nil, expiration: nil}, status: nil}
      {:ok, %{init_state: init_state, bypass: bypass}}
    end

    test "parses valid response with bridge lowered", %{bypass: bypass} do
      {:ok, state} = Notifications.Bridge.init([])

      json = %{
        "liftInProgress" => false,
        "estimatedDurationInMinutes" => 0
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(json)) end)

      assert {:noreply, %{status: {:lowered, nil}, token: _token}} = handle_info(:update, state)
    end

    test "parses valid response with bridge raised", %{bypass: bypass} do
      {:ok, state} = Notifications.Bridge.init([])

      json = %{
        "liftInProgress" => true,
        "estimatedDurationInMinutes" => 10
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(json)) end)

      now = Timex.now("America/New_York")
      {:noreply, %{status: {:raised, time}, token: _token}} = handle_info(:update, state)

      assert time >= now |> Timex.shift(minutes: 10) |> DateTime.to_unix()
    end

    test "notifies notification server when state changes", %{
      bypass: bypass,
      init_state: init_state
    } do
      test_pid = self()

      reassign_env(
        :notifications,
        :notifications_server_bridge_movement_fn,
        fn message -> send(test_pid, message) end
      )

      raise_json = %{
        "liftInProgress" => true,
        "estimatedDurationInMinutes" => 10
      }

      lower_json = %{
        "liftInProgress" => false,
        "estimatedDurationInMinutes" => 0
      }

      Bypass.stub(bypass, "GET", "BridgeRealTime", fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(raise_json))
      end)

      # No messages to the notification server if the original status is nil,
      # or the new status is identical to the original status
      {:noreply, raised_state} = handle_info(:update, init_state)

      {:noreply, ^raised_state} =
        handle_info(:update, %{token: raised_state.token, status: raised_state.status})

      refute_received(%{status: :raised})

      # But transitioning to the lowered state ought to send a message
      Bypass.stub(bypass, "GET", "BridgeRealTime", fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(lower_json))
      end)

      {:noreply, _lowered_state} = handle_info(:update, raised_state)
      assert_received(%{status: :lowered, lowering_time: nil})
    end

    test "Logs warning on bad message" do
      log =
        capture_log([level: :warning], fn ->
          {:noreply, _state} = handle_info(:bad_message, nil)
        end)

      assert log =~ "unknown message"
    end
  end

  describe "parse_response/1" do
    test "Logs warning with bad status code" do
      log =
        capture_log([level: :warning], fn ->
          refute parse_response({:ok, %HTTPoison.Response{status_code: 500}})
        end)

      assert log =~ "bridge_api_failure: status code 500"
    end

    test "Logs warning when request fails" do
      log =
        capture_log([level: :warning], fn ->
          refute parse_response({:error, %HTTPoison.Error{reason: "Unknown error"}})
        end)

      assert log =~ "bridge_api_failure: \"Unknown error\""
    end

    test "Logs warning when parsing fails" do
      log =
        capture_log([level: :warning], fn ->
          refute parse_response(
                   {:ok, %HTTPoison.Response{status_code: 201, body: "invalid json"}}
                 )
        end)

      assert log =~ "bridge_api_failure: could not parse json response"
    end
  end
end
