defmodule GtfsTest do
  use ExUnit.Case, async: true

  alias Gtfs.Route
  alias Gtfs.Stop
  alias Gtfs.StopTime
  alias Gtfs.Trip

  doctest Gtfs

  test "loads gtfs" do
    csvs = %{
      "routes.txt" => [
        "route_id,route_long_name",
        "Red,Red Line"
      ],
      "stops.txt" => [
        "stop_id",
        "place-pktrm"
      ],
      "stop_times.txt" => [
        "trip_id,stop_id",
        "red-trip,place-pktrm"
      ],
      "trips.txt" => [
        "trip_id,route_id",
        "red-trip,Red"
      ]
    }

    expected = %Gtfs{
      routes: [
        %Route{
          id: "Red"
        }
      ],
      stops: [
        %Stop{
          id: "place-pktrm"
        }
      ],
      stop_times: [
        %StopTime{
          trip_id: "red-trip",
          stop_id: "place-pktrm"
        }
      ],
      trips: [
        %Trip{
          id: "red-trip",
          route_id: "Red"
        }
      ]
    }

    {:ok, pid} = Gtfs.start_mocked(csvs)
    assert Gtfs.gtfs(server: pid) == expected
  end
end
