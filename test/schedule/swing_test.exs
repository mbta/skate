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

    test "the to_X values are set correctly when there is a mid-route swing" do
      blocks = %{}
    end

    # TODO: Is this test working? Should we change or add another test?
    # Maybe use block & trip factories to simplify data readability here
    test "handles mid-route swing" do
      route_id_during_swing = "route-id-during-swing"
      trip_id_during_swing = "trip-id-during-swing"
      run_id_during_swing = "run-id-during-swing"

      route_id_after_swing = "route-after-swing"
      run_id_after_swing = "run-after-swing"
      trip_id_after_swing = "trip-id-after-swing"

      blocks = %{
        "A12-34" =>
          build(
            :block,
            service_id: "b",
            id: "A12-34",
            pieces: [
              build(
                :piece,
                run_id: run_id_during_swing,
                block_id: "A12-34",
                trips: [
                  build(
                    :trip,
                    id: trip_id_during_swing,
                    service_id: "b",
                    block_id: "A12-34",
                    route_id: route_id_during_swing,
                    run_id: run_id_during_swing
                  )
                ],
                start_mid_route?: nil,
                end_mid_route?: true
              ),
              build(
                :piece,
                run_id: run_id_after_swing,
                block_id: "A12-34",
                trips: [
                  trip_id_after_swing
                ],
                start_mid_route?: %{
                  time: 150,
                  trip: trip_id_during_swing
                },
                end_mid_route?: false
              )
            ]
          )
      }

      trips_by_id = %{
        trip_id_after_swing =>
          build(
            :trip,
            id: trip_id_after_swing,
            block_id: "A12-34",
            route_id: route_id_after_swing,
            service_id: "b",
            run_id: run_id_after_swing
          ),
        trip_id_during_swing =>
          build(
            :trip,
            id: trip_id_during_swing,
            block_id: "A12-34",
            route_id: route_id_during_swing,
            service_id: "b",
            run_id: run_id_during_swing
          )
      }

      key = {"b", route_id_during_swing}

      assert %{
               ^key => [
                 %Swing{
                   block_id: "A12-34",
                   from_route_id: ^route_id_during_swing,
                   from_run_id: ^run_id_during_swing,
                   from_trip_id: ^trip_id_during_swing,
                   time: 150,
                   to_route_id: ^route_id_during_swing,
                   # to_route_id: "12", # ISSUE: Route ID is same for both trips in postured data
                   to_trip_id: ^trip_id_during_swing,
                   # to_trip_id: "5678", # ISSUE: should be the trip ID of the mid_route trip
                   to_run_id: ^run_id_after_swing
                   # to_run_id: "123-789", # CORRECT: should be the run_id of the first FULL run (not the start_mid_route run_id, which would always be the same as the from_run_id)
                 }
               ]
             } = Swing.from_blocks(blocks, trips_by_id)
    end

    test "handles mid route swing with as directed first trip" do
      route_id_during_swing = "route-id-during-swing"
      trip_id_during_swing = "trip-id-during-swing"
      run_id_during_swing = "run-id-during-swing"

      route_id_after_swing = "route-after-swing"
      run_id_after_swing = "run-after-swing"
      trip_id_after_swing = "trip-id-after-swing"

      as_directed_trip =
        build(
          :as_directed,
          start_time: 101,
          end_time: 200,
          start_place: "place1",
          end_place: "place2"
        )

      blocks = %{
        "A12-34" =>
          build(
            :block,
            service_id: "b",
            id: "A12-34",
            pieces: [
              build(
                :piece,
                run_id: run_id_during_swing,
                block_id: "A12-34",
                trips: [
                  build(
                    :trip,
                    id: trip_id_during_swing,
                    service_id: "b",
                    block_id: "A12-34",
                    route_id: route_id_during_swing,
                    run_id: run_id_during_swing
                  )
                ],
                start_mid_route?: nil,
                end_mid_route?: true
              ),
              build(
                :piece,
                run_id: run_id_after_swing,
                block_id: "A12-34",
                trips: [
                  as_directed_trip
                ],
                start_mid_route?: %{
                  time: 150,
                  trip: trip_id_during_swing
                },
                end_mid_route?: false
              )
            ]
          )
      }

      trips_by_id = %{
        trip_id_after_swing =>
          build(
            :trip,
            id: trip_id_after_swing,
            block_id: "A12-34",
            route_id: route_id_after_swing,
            service_id: "b",
            run_id: run_id_after_swing
          ),
        trip_id_during_swing =>
          build(
            :trip,
            id: trip_id_during_swing,
            block_id: "A12-34",
            route_id: route_id_during_swing,
            service_id: "b",
            run_id: run_id_during_swing
          )
      }

      key = {"b", route_id_during_swing}

      assert %{
               ^key => [
                 %Swing{
                   block_id: "A12-34",
                   from_route_id: ^route_id_during_swing,
                   from_run_id: ^run_id_during_swing,
                   from_trip_id: ^trip_id_during_swing,
                   time: 150,
                   to_route_id: ^route_id_during_swing,
                   # to_route_id: "12", # ISSUE: Route ID is same for both trips in postured data
                   to_trip_id: ^trip_id_during_swing,
                   # to_trip_id: "5678", # ISSUE: should be the trip ID of the mid_route trip
                   to_run_id: ^run_id_after_swing
                   # to_run_id: "123-789", # CORRECT: should be the run_id of the first FULL run (not the start_mid_route run_id, which would always be the same as the from_run_id)
                 }
               ]
             } = Swing.from_blocks(blocks, trips_by_id)
    end
  end

  test "ignores as directed work" do
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
        :as_directed,
        start_time: 101,
        end_time: 200,
        start_place: "place1",
        end_place: "place2"
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
                trip1
              ],
              end_time: 100,
              end_place: "place1",
              start_mid_route?: nil,
              end_mid_route?: false
            ),
            build(
              :piece,
              schedule_id: "a",
              run_id: "123-789",
              block_id: "A12-34",
              start_time: 101,
              start_place: "place1",
              trips: [
                trip2
              ],
              end_time: 200,
              end_place: "place2",
              start_mid_route?: nil,
              end_mid_route?: false
            )
          ]
        )
    }

    assert %{} == Swing.from_blocks(blocks, %{})
  end
end
