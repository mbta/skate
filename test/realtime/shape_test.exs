defmodule Realtime.ShapeTest do
  alias Skate.OpenRouteServiceAPI.DirectionsResponse
  alias Realtime.Shape
  alias Skate.Detours.RouteSegments
  use ExUnit.Case
  import Skate.Factory

  doctest Shape

  test "translates route segments and detour shape into encoded polyline shape" do
    route_segments = %RouteSegments.Result{
      before_detour: [
        build(:gtfs_stop, %{latitude: 42.425, longitude: -70.99}),
        build(:gtfs_stop, %{latitude: 42.431, longitude: -70.99})
      ],
      detour: [
        build(:gtfs_stop, %{latitude: 42.431, longitude: -70.99}),
        build(:gtfs_stop, %{latitude: 42.439, longitude: -70.99})
      ],
      after_detour: [
        build(:gtfs_stop, %{latitude: 42.439, longitude: -70.99}),
        build(:gtfs_stop, %{latitude: 42.445, longitude: -70.99})
      ]
    }

    detour_shape = %DirectionsResponse{
      coordinates: [
        %{"lat" => 42.43, "lon" => -71.01},
        %{"lat" => 42.438, "lon" => -71.01}
      ]
    }

    expected_encoded_polyline =
      Polyline.encode([
        # The chunk of the shape before the detour begins
        {-70.99, 42.425},
        {-70.99, 42.431},

        # The chunk of the shape that comes from the detour instead of
        # the original shape
        {-71.01, 42.43},
        {-71.01, 42.438},

        # The chunk of the shape after the detour ends
        {-70.99, 42.439},
        {-70.99, 42.445}
      ])

    assert %Shape{
             shape_id: "shape_id_1",
             encoded_polyline: ^expected_encoded_polyline
           } =
             Shape.new(%Shape.Input{
               shape_id: "shape_id_1",
               route_segments: route_segments,
               detour_shape: detour_shape
             })
  end
end
