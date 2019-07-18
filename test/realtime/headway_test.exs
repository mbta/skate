defmodule Realtime.HeadwayTest do
  use ExUnit.Case
  alias Realtime.Headway

  describe "current_headway_spacing" do
    test "returns very_gapped if headway_seconds is more than 200% expected_headway_seconds" do
      headway_seconds = 20
      expected_headway_seconds = 10

      assert Headway.current_headway_spacing(expected_headway_seconds, headway_seconds) ==
               :very_gapped
    end

    test "returns gapped if headway_seconds is between 150% and 200% expected_headway_seconds" do
      headway_seconds = 15
      expected_headway_seconds = 10

      assert Headway.current_headway_spacing(expected_headway_seconds, headway_seconds) ==
               :gapped
    end

    test "returns very_bunched if headway_seconds is less than 33% expected_headway_seconds" do
      headway_seconds = 3.3
      expected_headway_seconds = 10

      assert Headway.current_headway_spacing(expected_headway_seconds, headway_seconds) ==
               :very_bunched
    end

    test "returns bunched if headway_seconds is between 33% and 50% expected_headway_seconds" do
      headway_seconds = 5
      expected_headway_seconds = 10

      assert Headway.current_headway_spacing(expected_headway_seconds, headway_seconds) ==
               :bunched
    end

    test "returns ok if headway_seconds is between 50% and 150% expected_headway_seconds" do
      headway_seconds = 11
      expected_headway_seconds = 10

      assert Headway.current_headway_spacing(expected_headway_seconds, headway_seconds) ==
               :ok
    end
  end

  describe "current_expected_headway_seconds/4" do
    test "gives the current headawy for the route, durection, origin, and time period in seconds" do
      route_id = "15"
      direction_id = 1
      origin_stop_id = "323"
      monday_evening = Timex.to_datetime({{2019, 7, 8}, {19, 00, 00}}, :local)

      assert Headway.current_expected_headway_seconds(
               route_id,
               direction_id,
               origin_stop_id,
               monday_evening
             ) == 1_155
    end

    test "returns error if the route isn't found" do
      route_id = "bad route"
      direction_id = 1
      origin_stop_id = "323"
      monday_evening = Timex.to_datetime({{2019, 7, 8}, {19, 00, 00}}, :local)

      assert Headway.current_expected_headway_seconds(
               route_id,
               direction_id,
               origin_stop_id,
               monday_evening
             ) == :error
    end

    test "returns error if the direction_id isn't found" do
      route_id = "15"
      direction_id = 2
      origin_stop_id = "323"
      monday_evening = Timex.to_datetime({{2019, 7, 8}, {19, 00, 00}}, :local)

      assert Headway.current_expected_headway_seconds(
               route_id,
               direction_id,
               origin_stop_id,
               monday_evening
             ) == :error
    end

    test "returns error if the origin_stop_id isn't found" do
      route_id = "15"
      direction_id = 1
      origin_stop_id = "bad stop id"
      monday_evening = Timex.to_datetime({{2019, 7, 8}, {19, 00, 00}}, :local)

      assert Headway.current_expected_headway_seconds(
               route_id,
               direction_id,
               origin_stop_id,
               monday_evening
             ) == :error
    end
  end

  describe "time_in_seconds/1" do
    test "return the number of seconds given a time string in %H:%M:%S format" do
      time_string = "02:12:57"

      assert Headway.time_in_seconds(time_string) == 7_977
    end

    test "returns nil if given nil" do
      assert Headway.time_in_seconds(nil) == nil
    end
  end
end
