defmodule Schedule.SwingTest do
  use ExUnit.Case, async: true

  import Skate.Factory

  alias Schedule.Swing

  describe "from_blocks/2" do
    test "translates block information to swings" do
      trip1 =
        build(
          :trip,
          id: "0123",
          service_id: "b",
          block_id: "A12-34",
          route_id: "11",
          headsign: "Somewhere Else",
          direction_id: 0,
          run_id: "123-456",
          start_time: 1,
          end_time: 100,
          start_place: "place3",
          end_place: "place1"
        )

      trip2 =
        build(
          :trip,
          id: "1234",
          service_id: "b",
          block_id: "A12-34",
          route_id: "12",
          headsign: "Somewhere",
          direction_id: 0,
          run_id: "123-456",
          start_time: 101,
          end_time: 200,
          start_place: "place1",
          end_place: "place2"
        )

      trip3 =
        build(
          :trip,
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
          start_time: 200,
          end_time: 300,
          start_place: "place2",
          end_place: "place1"
        )

      trip4 =
        build(
          :trip,
          id: "6789",
          block_id: "A12-34",
          route_id: "11",
          service_id: "b",
          headsign: "Somewhere Else Entirely",
          direction_id: 1,
          route_pattern_id: "11-1",
          shape_id: nil,
          schedule_id: "a",
          stop_times: [],
          run_id: "123-789",
          start_time: 301,
          end_time: 400,
          start_place: "place1",
          end_place: "place3"
        )

      trip5 =
        build(
          :trip,
          id: "8901",
          block_id: "A12-34",
          route_id: "11",
          headsign: "Somewhere Else",
          direction_id: 0,
          run_id: "123-890",
          start_time: 400,
          end_time: 500,
          start_place: "place3",
          end_place: "place1"
        )

      blocks = %{
        "A12-34" =>
          build(
            :block,
            schedule_id: "a",
            service_id: "b",
            start_time: 1,
            end_time: 500,
            id: "A12-34",
            pieces: [
              build(
                :piece,
                schedule_id: "a",
                run_id: "123-456",
                block_id: "A12-34",
                start_time: 1,
                start_place: "place3",
                trips: [
                  trip1,
                  trip2
                ],
                end_time: 200,
                end_place: "place2",
                start_mid_route?: nil,
                end_mid_route?: false
              ),
              build(
                :piece,
                schedule_id: "a",
                run_id: "123-789",
                block_id: "A12-34",
                start_time: 200,
                start_place: "place2",
                trips: [
                  trip3.id,
                  trip4.id
                ],
                end_time: 400,
                end_place: "place3",
                start_mid_route?: nil,
                end_mid_route?: false
              ),
              build(
                :piece,
                schedule_id: "a",
                run_id: "123-456",
                block_id: "A12-34",
                start_time: 400,
                start_place: "place3",
                trips: [
                  trip5
                ],
                end_time: 500,
                end_place: "place1",
                start_mid_route?: nil,
                end_mid_route?: false
              )
            ]
          )
      }

      trips_by_id = %{
        "5678" => trip3,
        "6789" => trip4
      }

      assert Swing.from_blocks(blocks, trips_by_id) == %{
               {"b", "12"} => [
                 %Swing{
                   block_id: "A12-34",
                   from_route_id: "12",
                   from_run_id: "123-456",
                   from_trip_id: "1234",
                   to_route_id: "12",
                   to_run_id: "123-789",
                   to_trip_id: "5678",
                   time: 200
                 }
               ],
               {"b", "11"} => [
                 %Swing{
                   block_id: "A12-34",
                   from_route_id: "11",
                   from_run_id: "123-789",
                   from_trip_id: "6789",
                   to_route_id: "11",
                   to_run_id: "123-890",
                   to_trip_id: "8901",
                   time: 400
                 }
               ]
             }
    end

    test "doesn't include swings where no service information is present" do
      blocks = %{
        "A12-34" =>
          build(
            :block,
            schedule_id: "a",
            service_id: "service",
            start_time: 1,
            end_time: 500,
            id: "A12-34",
            pieces: [
              build(
                :piece,
                schedule_id: "a",
                run_id: "123-456",
                block_id: "A12-34",
                start_time: 1,
                start_place: "place1",
                trips: [
                  build(
                    :trip,
                    id: "1234",
                    block_id: "A12-34",
                    route_id: "12",
                    headsign: "Somewhere",
                    direction_id: 0,
                    run_id: "123-456",
                    start_time: 1,
                    end_time: 100,
                    start_place: "place1",
                    end_place: "place2",
                    service_id: nil
                  )
                ],
                end_time: 100,
                end_place: "place2",
                start_mid_route?: nil,
                end_mid_route?: false
              ),
              build(
                :piece,
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
              )
            ]
          )
      }

      trips_by_id = %{
        "5678" =>
          build(
            :trip,
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
          )
      }

      assert Swing.from_blocks(blocks, trips_by_id) == %{}
    end

    test "handles mid-route swing" do
      blocks = %{
        "A12-34" =>
          build(
            :block,
            schedule_id: "a",
            service_id: "b",
            start_time: 1,
            end_time: 2,
            id: "A12-34",
            pieces: [
              build(
                :piece,
                schedule_id: "a",
                run_id: "123-456",
                block_id: "A12-34",
                start_time: 101,
                start_place: "place1",
                trips: [
                  build(
                    :trip,
                    id: "1234",
                    service_id: "b",
                    block_id: "A12-34",
                    route_id: "12",
                    headsign: "Somewhere",
                    direction_id: 0,
                    run_id: "123-456",
                    start_time: 101,
                    end_time: 200,
                    start_place: "place1",
                    end_place: "place2"
                  )
                ],
                end_time: 150,
                end_place: "place2",
                start_mid_route?: nil,
                end_mid_route?: true
              ),
              build(
                :piece,
                schedule_id: "a",
                run_id: "123-789",
                block_id: "A12-34",
                start_time: 200,
                start_place: "place2",
                trips: [
                  "5678"
                ],
                end_time: 300,
                end_place: "place1",
                start_mid_route?: %{
                  time: 150,
                  trip: "1234"
                },
                end_mid_route?: false
              )
            ]
          )
      }

      trips_by_id = %{
        "5678" =>
          build(
            :trip,
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
            start_time: 200,
            end_time: 300,
            start_place: "place2",
            end_place: "place1"
          )
      }

      assert Swing.from_blocks(blocks, trips_by_id) == %{
               {"b", "12"} => [
                 %Swing{
                   block_id: "A12-34",
                   from_route_id: "12",
                   from_run_id: "123-456",
                   from_trip_id: "1234",
                   to_route_id: "12",
                   to_run_id: "123-789",
                   to_trip_id: "5678",
                   time: 150
                 }
               ]
             }
    end
  end
end
