defmodule Notifications.BridgeTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import Notifications.Bridge
  import ExUnit.CaptureLog

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
    test "parses valid response with bridge lowered" do
      bypass = Bypass.open()
      reassign_env(:skate, :bridge_url, "http://localhost:#{bypass.port}/")
      reassign_env(:skate, :bridge_api_username, "user")
      reassign_env(:skate, :bridge_api_password, "123")

      {:ok, state} = Notifications.Bridge.init([])

      json = %{
        "id" => "4321",
        "bridge" => %{
          "id" => "1",
          "name" => "Main St Bridge",
          "bridgeStatusId" => %{
            "id" => "2",
            "status" => "Lowered"
          }
        }
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(json)) end)

      assert handle_info(:update, state) == {:noreply, {:lowered, nil}}
    end

    test "parses valid response with bridge raised" do
      bypass = Bypass.open()
      reassign_env(:skate, :bridge_url, "http://localhost:#{bypass.port}/")
      reassign_env(:skate, :bridge_api_username, "user")
      reassign_env(:skate, :bridge_api_password, "123")

      {:ok, state} = Notifications.Bridge.init([])

      json = %{
        "id" => "4321",
        "bridge" => %{
          "id" => "1",
          "name" => "Main St Bridge",
          "bridgeStatusId" => %{
            "id" => "2",
            "status" => "Raised"
          }
        },
        "start_time" => "2020-01-01 01:01:01.0",
        "last_update_time" => "2020-01-01 01:01:01.0",
        "is_test_lift" => "false",
        "lift_estimate" => %{
          "id" => "4296",
          "estimate_time" => "2020-01-01 01:06:01.0",
          "duration" => "300",
          "lift_estimate_vessel_array" => [
            %{
              "vessel_type" => "Motorship",
              "vessel_direction" => "Upstream",
              "vessel_count" => 1
            },
            %{
              "vessel_type" => "Tugboat",
              "vessel_direction" => "Upstream",
              "vessel_count" => 1
            }
          ]
        }
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(json)) end)

      naive_date = ~N[2020-01-01 01:06:01.0]
      expected_time = naive_date |> Timex.to_datetime("America/New_York") |> DateTime.to_unix()

      assert handle_info(:update, state) == {:noreply, {:raised, expected_time}}
    end

    test "notifies notification server when state changes" do
      test_pid = self()

      reassign_env(
        :notifications,
        :notifications_server_bridge_movement_fn,
        fn message -> send(test_pid, message) end
      )

      bypass = Bypass.open()
      reassign_env(:skate, :bridge_api_username, "user")
      reassign_env(:skate, :bridge_api_password, "123")

      raise_json = %{
        "id" => "4321",
        "bridge" => %{
          "id" => "1",
          "name" => "Main St Bridge",
          "bridgeStatusId" => %{
            "id" => "2",
            "status" => "Raised"
          }
        },
        "start_time" => "2020-01-01 01:01:01.0",
        "last_update_time" => "2020-01-01 01:01:01.0",
        "is_test_lift" => "false",
        "lift_estimate" => %{
          "id" => "4296",
          "estimate_time" => "2020-01-01 01:06:01.0",
          "duration" => "300",
          "lift_estimate_vessel_array" => [
            %{
              "vessel_type" => "Motorship",
              "vessel_direction" => "Upstream",
              "vessel_count" => 1
            },
            %{
              "vessel_type" => "Tugboat",
              "vessel_direction" => "Upstream",
              "vessel_count" => 1
            }
          ]
        }
      }

      lower_json = %{
        "id" => "4321",
        "bridge" => %{
          "id" => "1",
          "name" => "Main St Bridge",
          "bridgeStatusId" => %{
            "id" => "2",
            "status" => "Lowered"
          }
        }
      }

      Bypass.stub(bypass, "GET", "/raise", fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(raise_json))
      end)

      Bypass.stub(bypass, "GET", "/lower", fn conn ->
        Plug.Conn.resp(conn, 200, Jason.encode!(lower_json))
      end)

      # No messages to the notification server if the original state is nil,
      # or the new state is identical to the original state.
      reassign_env(:skate, :bridge_url, "http://localhost:#{bypass.port}/raise")
      {:noreply, raised_state} = handle_info(:update, nil)
      {:noreply, ^raised_state} = handle_info(:update, raised_state)
      refute_received({:raised, _})

      # But transitioning to the lowered state ought to send a message

      reassign_env(:skate, :bridge_url, "http://localhost:#{bypass.port}/lower")
      {:noreply, _lowered_state} = handle_info(:update, raised_state)
      assert_received({:lowered, nil})
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
