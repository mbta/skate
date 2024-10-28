defmodule Schedule.Gtfs.RouteTest do
  use ExUnit.Case, async: true
  import Skate.Factory

  alias Schedule.Gtfs.{Direction, Route}

  describe "from_csv_row/1" do
    test "builds a Route struct from a csv row" do
      csv_row = %{
        "route_id" => "39",
        "agency_id" => "1",
        "route_short_name" => "39",
        "route_long_name" => "Forest Hills - Back Bay Station",
        "route_desc" => "Key Bus",
        "route_type" => "3",
        "route_url" => "https://www.mbta.com/schedules/39",
        "route_color" => "FFC72C",
        "route_text_color" => "000000",
        "route_sort_order" => "50390",
        "route_fare_class" => "Local Bus",
        "line_id" => "line-39",
        "listed_route" => ""
      }

      directions_by_route_id = %{
        "39" => %{
          0 => %Direction{
            route_id: "39",
            direction_id: 0,
            direction_name: "Outbound"
          },
          1 => %Direction{
            route_id: "39",
            direction_id: 1,
            direction_name: "Inbound"
          }
        }
      }

      expected = %Route{
        id: "39",
        description: "Key Bus",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        },
        name: "39"
      }

      assert Route.from_csv_row(csv_row, directions_by_route_id) == expected
    end
  end

  describe "row_has_route_type?/1" do
    test "true when route type present" do
      bus_route_csv_row = %{
        "route_id" => "39",
        "agency_id" => "1",
        "route_short_name" => "39",
        "route_long_name" => "Forest Hills - Back Bay Station",
        "route_desc" => "Key Bus",
        "route_type" => "3",
        "route_url" => "https://www.mbta.com/schedules/39",
        "route_color" => "FFC72C",
        "route_text_color" => "000000",
        "route_sort_order" => "50390",
        "route_fare_class" => "Local Bus",
        "line_id" => "line-39",
        "listed_route" => ""
      }

      assert Route.row_has_route_type?(bus_route_csv_row)
    end

    test "ensures a `route_type` property" do
      bad_route_csv_row = %{
        "route_id" => "39",
        "agency_id" => "1",
        "route_short_name" => "39",
        "route_long_name" => "Forest Hills - Back Bay Station",
        "route_desc" => "Key Bus",
        "route_type" => nil,
        "route_url" => "https://www.mbta.com/schedules/39",
        "route_color" => "FFC72C",
        "route_text_color" => "000000",
        "route_sort_order" => "50390",
        "route_fare_class" => "Local Bus",
        "line_id" => "line-39",
        "listed_route" => ""
      }

      assert_raise ArgumentError, fn ->
        Route.row_has_route_type?(bad_route_csv_row)
      end
    end
  end

  describe "bus_route_mbta?/1" do
    test "true for bus route" do
      assert Route.bus_route_mbta?(build(:gtfs_route, %{id: "1", type: 3}))
    end

    test "false for non-mbta bus route" do
      refute Route.bus_route_mbta?(build(:gtfs_route, %{id: "710", type: 3}))
    end

    test "false for  subway route" do
      refute Route.bus_route_mbta?(build(:gtfs_route, %{id: "RL", type: 1}))
    end
  end

  describe "shuttle_route?/1" do
    test "returns true if this route is a 'Rail Replacement Bus'" do
      shuttle_route = %Route{
        id: "Shuttle-BabcockBostonCollege",
        description: "Rail Replacement Bus",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        },
        name: "Green Line B Shuttle"
      }

      assert Route.shuttle_route?(shuttle_route)
    end

    test "returns false otherwise" do
      non_shuttle_route = %Route{
        id: "39",
        description: "Key Bus",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        },
        name: "39"
      }

      refute Route.shuttle_route?(non_shuttle_route)
    end
  end

  describe "subway_route?/1" do
    test "true for heavy rail route" do
      assert Route.subway_route?(build(:gtfs_route, %{id: "RL", type: 1}))
    end

    test "true for light rail route" do
      assert Route.subway_route?(build(:gtfs_route, %{id: "GL", type: 0}))
    end

    test "false for bus route" do
      refute Route.subway_route?(build(:gtfs_route, %{id: "1", type: 3}))
    end
  end
end
