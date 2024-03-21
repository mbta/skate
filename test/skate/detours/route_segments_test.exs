defmodule Skate.Detours.RouteSegmentsTest do
  use ExUnit.Case
  alias Skate.Detours.RouteSegments

  doctest RouteSegments

  alias Util.Location

  describe "route_segments" do
    test "divides a shape into segments based on the start and end points of a detour" do
      result =
        RouteSegments.route_segments(
          [
            Location.new(0, 0),
            Location.new(0, 1),
            Location.new(0, 2),
            Location.new(0, 3),
            Location.new(0, 4),
            Location.new(0, 5),
            Location.new(0, 6),
            Location.new(0, 7)
          ],
          Location.new(0, 2.5),
          Location.new(0, 5.5)
        )

      assert {:ok,
              %RouteSegments.Result{
                before_detour: [
                  Location.new(0, 0),
                  Location.new(0, 1),
                  Location.new(0, 2),
                  Location.new(0, 2.5)
                ],
                detour: [
                  Location.new(0, 2.5),
                  Location.new(0, 3),
                  Location.new(0, 4),
                  Location.new(0, 5),
                  Location.new(0, 5.5)
                ],
                after_detour: [Location.new(0, 5.5), Location.new(0, 6), Location.new(0, 7)]
              }} == result
    end

    test "works even if the start and end points are not exactly on the shape" do
      result =
        RouteSegments.route_segments(
          [
            Location.new(0, 0),
            Location.new(0, 1),
            Location.new(0, 2),
            Location.new(0, 3),
            Location.new(0, 4),
            Location.new(0, 5),
            Location.new(0, 6),
            Location.new(0, 7)
          ],
          Location.new(0.1, 3.1),
          Location.new(0, 4.9)
        )

      assert {:ok,
              %RouteSegments.Result{
                before_detour: [
                  Location.new(0, 0),
                  Location.new(0, 1),
                  Location.new(0, 2),
                  Location.new(0, 3),
                  Location.new(0, 3.1)
                ],
                detour: [
                  Location.new(0, 3.1),
                  Location.new(0, 4),
                  Location.new(0, 4.9)
                ],
                after_detour: [
                  Location.new(0, 4.9),
                  Location.new(0, 5),
                  Location.new(0, 6),
                  Location.new(0, 7)
                ]
              }} == result
    end

    test "has infinitely-small 'before' and 'after' segments if the start and end points are past the ends" do
      result =
        RouteSegments.route_segments(
          [
            Location.new(0, 0),
            Location.new(0, 1),
            Location.new(0, 2),
            Location.new(0, 3),
            Location.new(0, 4),
            Location.new(0, 5),
            Location.new(0, 6),
            Location.new(0, 7)
          ],
          Location.new(-0.1, 0),
          Location.new(0, 7.1)
        )

      assert {:ok,
              %RouteSegments.Result{
                before_detour: [
                  Location.new(0, 0),
                  Location.new(0, 0)
                ],
                detour: [
                  Location.new(0, 0),
                  Location.new(0, 1),
                  Location.new(0, 2),
                  Location.new(0, 3),
                  Location.new(0, 4),
                  Location.new(0, 5),
                  Location.new(0, 6),
                  Location.new(0, 7)
                ],
                after_detour: [
                  Location.new(0, 7),
                  Location.new(0, 7)
                ]
              }} == result
    end

    test "has single-segment 'before' and 'after' segments if the start and end points are close to the ends" do
      result =
        RouteSegments.route_segments(
          [
            Location.new(0, 0),
            Location.new(0, 1),
            Location.new(0, 2),
            Location.new(0, 3),
            Location.new(0, 4),
            Location.new(0, 5),
            Location.new(0, 6),
            Location.new(0, 7)
          ],
          Location.new(0.1, 0.1),
          Location.new(0, 6.9)
        )

      assert {:ok,
              %RouteSegments.Result{
                before_detour: [
                  Location.new(0, 0),
                  Location.new(0, 0.1)
                ],
                detour: [
                  Location.new(0, 0.1),
                  Location.new(0, 1),
                  Location.new(0, 2),
                  Location.new(0, 3),
                  Location.new(0, 4),
                  Location.new(0, 5),
                  Location.new(0, 6),
                  Location.new(0, 6.9)
                ],
                after_detour: [
                  Location.new(0, 6.9),
                  Location.new(0, 7)
                ]
              }} == result
    end

    test "has a short 'detour' segment if the start and end points are too close together" do
      result =
        RouteSegments.route_segments(
          [
            Location.new(0, 0),
            Location.new(0, 1),
            Location.new(0, 2),
            Location.new(0, 3),
            Location.new(0, 4),
            Location.new(0, 5),
            Location.new(0, 6),
            Location.new(0, 7)
          ],
          Location.new(0.1, 5.4),
          Location.new(0, 5.5)
        )

      assert {:ok,
              %RouteSegments.Result{
                before_detour: [
                  Location.new(0, 0),
                  Location.new(0, 1),
                  Location.new(0, 2),
                  Location.new(0, 3),
                  Location.new(0, 4),
                  Location.new(0, 5),
                  Location.new(0, 5.4)
                ],
                detour: [
                  Location.new(0, 5.4),
                  Location.new(0, 5.5)
                ],
                after_detour: [
                  Location.new(0, 5.5),
                  Location.new(0, 6),
                  Location.new(0, 7)
                ]
              }} == result
    end

    test "returns :error if 'shape' is empty" do
      result =
        RouteSegments.route_segments(
          [],
          Location.new(0.1, 5),
          Location.new(0, 5.1)
        )

      assert :error == result
    end

    test "returns :error if 'shape' has one element" do
      result =
        RouteSegments.route_segments(
          [Location.new(0, 6)],
          Location.new(0.1, 5),
          Location.new(0, 5.1)
        )

      assert :error == result
    end
  end
end
