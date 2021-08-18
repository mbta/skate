defmodule Schedule.RunTest do
  use ExUnit.Case, async: true
  import Skate.Factory

  alias Schedule.Run

  import Skate.Factory

  describe "is_active?/3" do
    test "returns true when a piece overlaps with the range given" do
      trip1 = build(:trip, %{id: "trip1", start_time: 10, end_time: 40})
      trip2 = build(:trip, %{id: "trip2", start_time: 60, end_time: 90})
      trip3 = build(:trip, %{id: "trip3", start_time: 210, end_time: 290})

      trips = %{"trip1" => trip1, "trip2" => trip2, "trip3" => trip3}

      run =
        build(:run, %{
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
        build(:run, %{
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
