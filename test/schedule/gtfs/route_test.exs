defmodule Schedule.Gtfs.RouteTest do
  use ExUnit.Case, async: true

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

  describe "bus_route_valid_row?/1" do
    test "returns whether or not this row represents a bus route" do
      bus_csv_row = %{
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

      subway_csv_row = %{
        "route_id" => "Red",
        "agency_id" => "1",
        "route_short_name" => "",
        "route_long_name" => "Red Line",
        "route_desc" => "Rapid Transit",
        "route_type" => "1",
        "route_url" => "https://www.mbta.com/schedules/Red",
        "route_color" => "DA291C",
        "route_text_color" => "FFFFFF",
        "route_sort_order" => "10010",
        "route_fare_class" => "Rapid Transit",
        "line_id" => "line-Red",
        "listed_route" => ""
      }

      private_carrier_csv_row = %{
        "route_id" => "710",
        "agency_id" => "1",
        "route_short_name" => "710",
        "route_long_name" => "North Medford - Wellington Station",
        "route_desc" => "Local Bus",
        "route_type" => "3",
        "route_url" => "https://www.mbta.com/schedules/710",
        "route_color" => "FFC72C",
        "route_text_color" => "000000",
        "route_sort_order" => "57100",
        "route_fare_class" => "Local Bus",
        "line_id" => "line-710",
        "listed_route" => ""
      }

      assert Route.bus_route_valid_row?(bus_csv_row)
      refute Route.bus_route_valid_row?(subway_csv_row)
      refute Route.bus_route_valid_row?(private_carrier_csv_row)
    end

    test "ensures a `route_type` property" do
      bad_csv_row = %{
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
        Route.bus_route_valid_row?(bad_csv_row)
      end
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
end
