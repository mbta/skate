defmodule Realtime.BlockWaiverTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{StopTime, Trip}
  alias Realtime.BlockWaiver

  @trip1 %Trip{
    id: "trip1",
    route_id: "route",
    service_id: "service",
    headsign: "headsign",
    direction_id: 0,
    block_id: "block",
    shape_id: "shape",
    stop_times: [
      %StopTime{stop_id: "stop1", time: 1},
      %StopTime{stop_id: "stop2", time: 2},
      %StopTime{stop_id: "stop3", time: 3}
    ]
  }

  @trip2 %Trip{
    id: "trip2",
    route_id: "route",
    service_id: "service",
    headsign: "headsign",
    direction_id: 1,
    block_id: "block",
    shape_id: "shape",
    stop_times: [
      %StopTime{stop_id: "stop3", time: 4},
      %StopTime{stop_id: "stop2", time: 5},
      %StopTime{stop_id: "stop1", time: 6}
    ]
  }

  @trip1stop1Update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    remark: "E:1106",
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "stop1",
    stop_sequence: nil,
    track: nil,
    trip_id: "trip1",
    uncertainty: nil
  }

  @trip1stop2Update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    remark: "E:1106",
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "stop2",
    stop_sequence: nil,
    track: nil,
    trip_id: "trip1",
    uncertainty: nil
  }

  @trip2stop1Update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    remark: "E:1106",
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "stop1",
    stop_sequence: nil,
    track: nil,
    trip_id: "trip2",
    uncertainty: nil
  }

  describe "block_waivers_for_block/1" do
    setup do
      block = [@trip1, @trip2]

      reassign_env(:realtime, :active_blocks_fn, fn _, _ ->
        %{Util.Time.today() => block}
      end)

      reassign_env(:realtime, :stop_time_updates_fn, fn trip_id ->
        case trip_id do
          "trip1" ->
            [@trip1stop1Update, @trip1stop2Update]

          "trip2" ->
            [@trip2stop1Update]

          _ ->
            []
        end
      end)

      {:ok, block: block}
    end

    test "returns block waivers for consecutive skipped stops on a trip", %{block: block} do
      assert [
               %BlockWaiver{},
               %BlockWaiver{}
             ] = BlockWaiver.block_waivers_for_block(block)
    end

    test "returns an empty list if no trips have skipped stops" do
      assert BlockWaiver.block_waivers_for_block([]) == []
    end

    test "returns an empty list if the block was nil" do
      assert BlockWaiver.block_waivers_for_block(nil) == []
    end
  end

  describe "trip_stop_time_waivers/1" do
    setup do
      reassign_env(:realtime, :stop_time_updates_fn, fn trip_id ->
        if trip_id == @trip1.id do
          [@trip1stop1Update, @trip1stop2Update]
        else
          []
        end
      end)
    end

    test "breaks out trip_stop_time_waivers for each stop on the trip" do
      expected = [
        {1, @trip1stop1Update},
        {2, @trip1stop2Update},
        {3, nil}
      ]

      assert BlockWaiver.trip_stop_time_waivers(@trip1) == expected
    end
  end

  describe "group_consecutive_sequences/1" do
    test "removes trip_stop_time_waivers missing a waiver" do
      trip_stop_time_waivers = [{1, nil}]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == []
    end

    test "includes trip_stop_time_waivers with a waiver" do
      trip_stop_time_waiver1 = {1, @trip1stop1Update}
      trip_stop_time_waiver2 = {2, @trip1stop2Update}

      trip_stop_time_waivers = [
        trip_stop_time_waiver1,
        trip_stop_time_waiver2,
        {3, nil}
      ]

      expected = [
        [trip_stop_time_waiver1, trip_stop_time_waiver2]
      ]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == expected
    end

    test "extends groups across trips" do
      trip_stop_time_waivers = [
        {1, @trip1stop1Update},
        {1, @trip1stop2Update},
        {1, @trip2stop1Update}
      ]

      expected = [trip_stop_time_waivers]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == expected
    end

    test "breaks apart groups at a stop without a waiver" do
      trip_stop_time_waiver1 = {1, @trip1stop1Update}
      trip_stop_time_waiver2 = {1, @trip1stop2Update}

      trip_stop_time_waivers = [
        trip_stop_time_waiver1,
        {1, nil},
        trip_stop_time_waiver2
      ]

      expected = [
        [trip_stop_time_waiver1],
        [trip_stop_time_waiver2]
      ]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == expected
    end

    test "breaks apart groups at a new waiver remark" do
      trip_stop_time_waiver1 = {1, @trip1stop1Update}

      trip_stop_time_waiver2 = {1, %StopTimeUpdate{@trip1stop2Update | remark: "new remark"}}

      trip_stop_time_waivers = [
        trip_stop_time_waiver1,
        trip_stop_time_waiver2
      ]

      expected = [
        [trip_stop_time_waiver1],
        [trip_stop_time_waiver2]
      ]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == expected
    end

    test "breaks apart groups if the time gap is > 60 minutes" do
      trip_stop_time_waiver1 = {0, @trip1stop1Update}
      trip_stop_time_waiver2 = {3601, @trip1stop2Update}

      trip_stop_time_waivers = [
        trip_stop_time_waiver1,
        trip_stop_time_waiver2
      ]

      expected = [
        [trip_stop_time_waiver1],
        [trip_stop_time_waiver2]
      ]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == expected
    end
  end

  describe "from_trip_stop_time_waivers" do
    test "builds a BlockWaiver from a list of trip_stop_time_waivers, converting times of day to timestamps" do
      trip_stop_time_waivers = [
        {1, @trip1stop1Update},
        {2, @trip1stop2Update}
      ]

      assert %BlockWaiver{
               start_time: start_time,
               end_time: end_time,
               remark: "E:1106"
             } =
               BlockWaiver.from_trip_stop_time_waivers(trip_stop_time_waivers, Util.Time.today())

      assert is_number(start_time)
      assert is_number(end_time)
    end
  end
end
