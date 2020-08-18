defmodule Notifications.NotificationServerTest do
  use ExUnit.Case

  alias Notifications.NotificationServer
  alias Realtime.BlockWaiver
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

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = NotificationServer.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "handle_cast/2" do
    setup do
      reassign_env(:realtime, :block_fn, fn _, _ -> @block end)

      reassign_env(:realtime, :active_blocks_fn, fn _, _ ->
        %{~D[2020-08-17] => [@block]}
      end)
    end

    test "creates new notifications for waivers with recognized reason" do
      log =
        capture_log(fn ->
          NotificationServer.handle_cast({:new_block_waivers, %{}}, nil)
        end)

      assert log == ""

      reasons_map = %{
        "B - Manpower" => :manpower,
        "D - Disabled" => :disabled,
        "E - Diverted" => :diverted,
        "G - Accident" => :accident
      }

      # Midnight Eastern time, 8/17/2020
      midnight = 1_597_636_800

      for {reason_string, reason_atom} <- reasons_map do
        log =
          capture_log(fn ->
            NotificationServer.handle_cast(
              {:new_block_waivers,
               %{
                 {"block1", "service1"} => [
                   %BlockWaiver{
                     start_time: midnight + 100,
                     end_time: midnight + 500,
                     cause_id: 666,
                     cause_description: reason_string,
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
               }},
              nil
            )
          end)

        assert String.contains?(log, "reason: :#{reason_atom}")
        assert String.contains?(log, "route_ids: [\"1\", \"2\"]")
        assert String.contains?(log, "run_ids: [\"run1\", \"run2\"]")
        assert String.contains?(log, "trip_ids: [\"trip1\", \"trip2\"]")
      end
    end
  end
end
