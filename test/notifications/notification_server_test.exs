defmodule Notifications.NotificationServerTest do
  use ExUnit.Case, async: false

  alias Notifications.NotificationServer
  alias Realtime.BlockWaiver
  alias Realtime.Vehicle
  alias Schedule.Block
  alias Schedule.Trip

  import ExUnit.CaptureLog, only: [capture_log: 1]
  import Test.Support.Helpers, only: [reassign_env: 3]

  require Logger

  @block %Block{
    id: "block1",
    service_id: "service1",
    start_time: 1,
    end_time: 1000,
    trips: [
      %Trip{
        id: "trip1",
        block_id: "block1",
        run_id: "run1",
        route_id: "1",
        start_time: 50,
        end_time: 200
      },
      %Trip{
        id: "trip2",
        block_id: "block1",
        run_id: "run2",
        route_id: "2",
        start_time: 400,
        end_time: 800
      },
      %Trip{
        id: "not_covered_by_waiver",
        block_id: "block1",
        run_id: "run3",
        route_id: "3",
        start_time: 501,
        end_time: 800
      }
    ]
  }
  @vehicle %Vehicle{
    id: "y0507",
    label: "0507",
    timestamp: 123,
    latitude: 0.0,
    longitude: 0.0,
    direction_id: "234",
    route_id: "SL9001",
    trip_id: "456",
    bearing: nil,
    block_id: nil,
    operator_id: "56785678",
    operator_name: "CHARLIE",
    operator_logon_time: nil,
    run_id: "123-4567",
    headway_secs: 600,
    headway_spacing: :ok,
    is_shuttle: false,
    is_overload: false,
    is_off_course: false,
    layover_departure_time: nil,
    block_is_active: true,
    sources: MapSet.new(["swiftly"]),
    data_discrepancies: [],
    stop_status: %{
      stop_id: "567",
      stop_name: "567"
    },
    timepoint_status: %{
      timepoint_id: "tp2",
      fraction_until_timepoint: 0.4
    },
    route_status: :on_route,
    end_of_trip_type: :another_trip
  }

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = NotificationServer.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "new_block_waivers/2" do
    setup do
      reassign_env(:realtime, :block_fn, fn _, _ -> @block end)

      reassign_env(:realtime, :active_blocks_fn, fn _, _ ->
        %{~D[2020-08-17] => [@block]}
      end)
    end

    test "broadcasts and logs new notifications for waivers with recognized reason" do
      reassign_env(:realtime, :peek_at_vehicles_fn, fn _ ->
        [@vehicle]
      end)

      registry_name = :new_notifications_registry
      start_supervised({Registry, keys: :duplicate, name: registry_name})
      reassign_env(:notifications, :registry, registry_name)

      {:ok, server} = NotificationServer.start_link(name: :new_notifications)
      NotificationServer.subscribe(server)

      log =
        capture_log(fn ->
          NotificationServer.handle_cast({:new_block_waivers, %{}}, nil)
        end)

      assert log == ""

      # See Realtime.BlockWaiver for the full mapping
      reasons_map = %{
        1 => {"J - Other", :other},
        23 => {"B - Manpower", :manpower},
        25 => {"D - Disabled", :disabled},
        26 => {"E - Diverted", :diverted},
        27 => {"F - Traffic", :traffic},
        28 => {"G - Accident", :accident},
        30 => {"I - Operator Error", :operator_error},
        31 => {"K - Adjusted", :adjusted}
      }

      # Midnight Eastern time, 8/17/2020
      midnight = 1_597_636_800

      for {cause_id, {cause_description, cause_atom}} <- reasons_map do
        waiver_map = %{
          {"block1", "service1"} => [
            %BlockWaiver{
              start_time: midnight + 100,
              end_time: midnight + 500,
              cause_id: cause_id,
              cause_description: cause_description,
              remark: "some_remark"
            },
            %BlockWaiver{
              start_time: midnight,
              end_time: midnight + 86400,
              cause_id: 999,
              cause_description: "W - Whatever",
              remark: "Ignored due to unrecognized cause_description"
            }
          ]
        }

        log =
          capture_log(fn ->
            NotificationServer.new_block_waivers(waiver_map, server)
            Process.sleep(50)
          end)

        assert_received(
          {:notifications,
           [
             %Notifications.Notification{
               created_at: _,
               reason: ^cause_atom,
               route_ids: ["1", "2"],
               run_ids: ["run1", "run2"],
               trip_ids: ["trip1", "trip2"],
               operator_name: "CHARLIE",
               operator_id: "56785678",
               route_id_at_creation: "SL9001"
             }
           ]}
        )

        assert String.contains?(log, "reason: :#{cause_atom}")
        assert String.contains?(log, "route_ids: [\"1\", \"2\"]")
        assert String.contains?(log, "run_ids: [\"run1\", \"run2\"]")
        assert String.contains?(log, "trip_ids: [\"trip1\", \"trip2\"]")
      end
    end
  end
end
