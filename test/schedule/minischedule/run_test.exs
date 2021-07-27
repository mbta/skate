defmodule Schedule.Minischedule.RunTest do
  use ExUnit.Case, async: true
  import Skate.Factory

  alias Schedule.Trip
  alias Schedule.Break
  alias Schedule.Piece
  alias Schedule.Minischedule.Run

  import Skate.Factory

  describe "hydrate" do
    test "hydrates the trips in pieces" do
      trip_id = "trip"

      stored_trip = build(:trip, id: trip_id, start_place: "start", end_place: "end")

      stored_run =
        build(:minischedule_run,
          activities: [
            build(:piece,
              block_id: "block",
              start_time: 0,
              start_place: "place",
              trips: [trip_id],
              end_time: 0,
              end_place: "place"
            )
          ]
        )

      expected_trip = %Trip{
        stored_trip
        | pretty_start_place: "Start place",
          pretty_end_place: "End place"
      }

      expected_run = %Run{
        schedule_id: "schedule",
        service_id: "service",
        id: "run",
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 0,
            start_place: "place",
            trips: [
              expected_trip
            ],
            end_time: 0,
            end_place: "place"
          }
        ]
      }

      assert Run.hydrate(stored_run, %{trip_id => stored_trip}, %{
               "start" => "Start place",
               "end" => "End place"
             }) == expected_run
    end

    test "passes breaks through unchanged apart from making names human-readable" do
      break = %Break{
        break_type: "break",
        start_time: 0,
        end_time: 1,
        start_place: "start",
        end_place: "end"
      }

      run = %Run{
        schedule_id: "schedule",
        id: "run",
        activities: [break]
      }

      expected_result = %Run{
        run
        | activities: [
            %{break | start_place: "Startpoint", end_place: "End Of The Line"}
          ]
      }

      assert Run.hydrate(run, %{}, %{"start" => "Startpoint", "end" => "End Of The Line"}) ==
               expected_result
    end
  end

  describe "is_active?/3" do
    test "returns true when a piece overlaps with the range given" do
      trip1 = build(:trip, %{id: "trip1", start_time: 10, end_time: 40})
      trip2 = build(:trip, %{id: "trip2", start_time: 60, end_time: 90})
      trip3 = build(:trip, %{id: "trip3", start_time: 210, end_time: 290})

      trips = %{"trip1" => trip1, "trip2" => trip2, "trip3" => trip3}

      run =
        build(:minischedule_run, %{
          activities: [
            build(:piece, %{start_time: 0, end_time: 100, trips: ["trip1", "trip2"]}),
            build(:piece, %{
              start_time: 200,
              end_time: 300,
              trips: [build(:trip, %{id: "trip3"})]
            })
          ]
        })

      assert Run.is_active?(run, trips, 45, 55)
    end

    test "returns false when a piece does not overlap with the range given" do
      trip1 = build(:trip, %{id: "trip1", start_time: 10, end_time: 40})
      trip2 = build(:trip, %{id: "trip2", start_time: 60, end_time: 90})

      trips = %{"trip1" => trip1, "trip2" => trip2}

      run =
        build(:minischedule_run, %{
          activities: [
            build(:piece, %{start_time: 0, end_time: 100, trips: ["trip1", "trip2"]}),
            build(:piece, %{
              start_time: 200,
              end_time: 300,
              trips: [build(:as_directed, %{start_time: 210, end_time: 290})]
            })
          ]
        })

      refute Run.is_active?(run, trips, 95, 175)
    end
  end
end
