defmodule Schedule.Minischedule.TripTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.StopTime
  alias Schedule.Minischedule

  describe "from_full_trip" do
    test "converts trips with minimal fields" do
      assert Minischedule.Trip.from_full_trip(
        %Schedule.Trip{
          id: "id",
          block_id: "block_id",
        }
      ) == %Minischedule.Trip{
          id: "id",
          block_id: "block_id",
      }
    end

    test "converts trips with all fields" do
      assert Minischedule.Trip.from_full_trip(
        %Schedule.Trip{
          id: "id",
          block_id: "block_id",
          route_id: "route_id",
          service_id: "service_id",
          headsign: "headsign",
          direction_id: 1,
          route_pattern_id: "RP-X-1",
          shape_id: "shape_id",
          schedule_id: "schedule_id",
          run_id: "run_id",
          stop_times: [
            %StopTime{
              stop_id: "stop_id",
              time: 5,
            }
          ],
          start_time: 4,
          end_time: 6
        }
      ) == %Minischedule.Trip{
          id: "id",
          block_id: "block_id",
          route_id: "route_id",
          headsign: "headsign",
          direction_id: 1,
          via_variant: "X",
          run_id: "run_id",
          start_time: 4,
          end_time: 6
      }
    end
  end
end
