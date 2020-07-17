defmodule GeonamesTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Geonames

  describe "nearest_intersection" do
    test "returns nil if the request fails" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")
      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 500, "") end)
      assert Geonames.nearest_intersection("0.0", "0.0") == nil
    end

    test "parses the street names out" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      json = %{
        "credits" => "1.0",
        "intersection" => %{
          "mtfcc1" => "S1400",
          "mtfcc2" => "S1400",
          "adminCode1" => "CA",
          "lng" => "-122.180842",
          "distance" => "0.08",
          "bearing" => "242",
          "placename" => "Menlo Park",
          "street1Bearing" => "213",
          "street2Bearing" => "303",
          "adminName2" => "San Mateo",
          "postalcode" => "94025",
          "countryCode" => "US",
          "street1" => "Roble Ave",
          "street2" => "Curtis St",
          "adminName1" => "California",
          "lat" => "37.450649"
        }
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(json)) end)
      assert Geonames.nearest_intersection("40", "-70") == "Roble Ave & Curtis St"
    end

    test "returns nil if there is no nearby intersection" do
      bypass = Bypass.open()
      reassign_env(:skate, :geonames_url_base, "http://localhost:#{bypass.port}")

      json = %{
        "credits" => "1.0"
      }

      Bypass.expect(bypass, fn conn -> Plug.Conn.resp(conn, 200, Jason.encode!(json)) end)
      assert Geonames.nearest_intersection("40", "-70") == nil
    end
  end
end
