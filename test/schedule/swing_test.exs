defmodule Schedule.SwingTest do
  use ExUnit.Case, async: true

  alias Schedule.Swing
  alias Schedule.Minischedule
  alias Schedule.Trip

  describe "from_minischedule_blocks/2" do
    test "translates block information to swings" do
      minischedule_blocks = %{
        "A12-34" => %Minischedule.Block{
          schedule_id: "a",
          id: "A12-34",
          pieces: [
            %Minischedule.Piece{
              schedule_id: "a",
              run_id: "123-456",
              block_id: "A12-34",
              start_time: 1,
              start_place: "place1",
              trips: [
                %Minischedule.Trip{
                  id: "1234",
                  block_id: "A12-34",
                  route_id: "12",
                  headsign: "Somewhere",
                  direction_id: 0,
                  via_variant: nil,
                  run_id: "123-456",
                  start_time: 1,
                  end_time: 100,
                  start_place: "place1",
                  end_place: "place2"
                }
              ],
              end_time: 100,
              end_place: "place2",
              start_mid_route?: nil,
              end_mid_route?: false
            },
            %Minischedule.Piece{
              schedule_id: "a",
              run_id: "123-789",
              block_id: "A12-34",
              start_time: 100,
              start_place: "place2",
              trips: [
                "5678"
              ],
              end_time: 200,
              end_place: "place1",
              start_mid_route?: nil,
              end_mid_route?: false
            }
          ]
        }
      }

      trips_by_id = %{
        "5678" => %Trip{
          id: "5678",
          block_id: "A12-34",
          route_id: "12",
          service_id: "b",
          headsign: "Somewhere Else",
          direction_id: 1,
          route_pattern_id: "12-1",
          shape_id: nil,
          schedule_id: "a",
          stop_times: [],
          run_id: "123-789",
          start_time: 100,
          end_time: 200,
          start_place: "place2",
          end_place: "place1"
        }
      }

      assert Swing.from_minischedule_blocks(minischedule_blocks, trips_by_id) == %{
               {"b", "12"} => [
                 %Swing{
                   from_route_id: "12",
                   from_run_id: "123-456",
                   from_trip_id: "1234",
                   to_route_id: "12",
                   to_run_id: "123-789",
                   to_trip_id: "5678",
                   time: 100
                 }
               ]
             }
    end

    test "doesn't include swings where no service information is present" do
      minischedule_blocks = %{
        "A12-34" => %Minischedule.Block{
          schedule_id: "a",
          id: "A12-34",
          pieces: [
            %Minischedule.Piece{
              schedule_id: "a",
              run_id: "123-456",
              block_id: "A12-34",
              start_time: 1,
              start_place: "place1",
              trips: [
                %Minischedule.Trip{
                  id: "1234",
                  block_id: "A12-34",
                  route_id: "12",
                  headsign: "Somewhere",
                  direction_id: 0,
                  via_variant: nil,
                  run_id: "123-456",
                  start_time: 1,
                  end_time: 100,
                  start_place: "place1",
                  end_place: "place2"
                }
              ],
              end_time: 100,
              end_place: "place2",
              start_mid_route?: nil,
              end_mid_route?: false
            },
            %Minischedule.Piece{
              schedule_id: "a",
              run_id: "123-789",
              block_id: "A12-34",
              start_time: 100,
              start_place: "place2",
              trips: [
                "5678"
              ],
              end_time: 200,
              end_place: "place1",
              start_mid_route?: nil,
              end_mid_route?: false
            }
          ]
        }
      }

      trips_by_id = %{
        "5678" => %Trip{
          id: "5678",
          block_id: "A12-34",
          route_id: "12",
          service_id: nil,
          headsign: "Somewhere Else",
          direction_id: 1,
          route_pattern_id: "12-1",
          shape_id: nil,
          schedule_id: "a",
          stop_times: [],
          run_id: "123-789",
          start_time: 100,
          end_time: 200,
          start_place: "place2",
          end_place: "place1"
        }
      }

      assert Swing.from_minischedule_blocks(minischedule_blocks, trips_by_id) == %{}
    end
  end
end
