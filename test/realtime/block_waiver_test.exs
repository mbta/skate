defmodule Realtime.BlockWaiverTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Concentrate.StopTimeUpdate
  alias Schedule.Gtfs.StopTime
  alias Realtime.BlockWaiver

  @trip1 build(
           :trip,
           id: "trip1",
           block_id: "block",
           service_id: "service",
           stop_times: [
             %StopTime{stop_id: "stop1", time: 1},
             %StopTime{stop_id: "stop2", time: 2},
             %StopTime{stop_id: "stop3", time: 3}
           ]
         )

  @trip2 build(
           :trip,
           id: "trip2",
           block_id: "block",
           service_id: "service",
           stop_times: [
             %StopTime{stop_id: "stop3", time: 4},
             %StopTime{stop_id: "stop2", time: 5},
             %StopTime{stop_id: "stop1", time: 6}
           ]
         )

  @block build(
           :block,
           start_time: 1,
           end_time: 6,
           pieces: [build(:piece, trips: [@trip1, @trip2])]
         )

  @trip1_stop1_update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    cause_id: 26,
    cause_description: "E - Diverted",
    remark: "E:1106",
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "stop1",
    stop_sequence: nil,
    track: nil,
    trip_id: "trip1",
    uncertainty: nil
  }

  @trip1_stop2_update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    cause_id: 26,
    cause_description: "E - Diverted",
    remark: "E:1106",
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "stop2",
    stop_sequence: nil,
    track: nil,
    trip_id: "trip1",
    uncertainty: nil
  }

  @trip2_stop1_update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    cause_id: 26,
    cause_description: "E - Diverted",
    remark: "E:1106",
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "stop1",
    stop_sequence: nil,
    track: nil,
    trip_id: "trip2",
    uncertainty: nil
  }

  @stop_time_updates_by_trip %{
    @trip1.id => [@trip1_stop1_update, @trip1_stop2_update],
    @trip2.id => [@trip2_stop1_update]
  }

  describe "block_waivers_for_block/1" do
    setup do
      reassign_env(:realtime, :active_blocks_fn, fn _, _ ->
        %{Util.Time.today() => [@block]}
      end)
    end

    test "returns block waivers for consecutive skipped stops on a trip" do
      assert [
               %BlockWaiver{},
               %BlockWaiver{}
             ] = BlockWaiver.block_waivers_for_block(@block, @stop_time_updates_by_trip)
    end

    test "returns an empty list if no trips have skipped stops" do
      assert BlockWaiver.block_waivers_for_block(@block, %{}) == []
    end

    test "returns an empty list if the block was nil" do
      assert BlockWaiver.block_waivers_for_block(nil, @stop_time_updates_by_trip) == []
    end
  end

  describe "trip_stop_time_waivers/1" do
    test "breaks out trip_stop_time_waivers for each stop on the trip" do
      expected = [
        {1, @trip1_stop1_update},
        {2, @trip1_stop2_update},
        {3, nil}
      ]

      assert BlockWaiver.trip_stop_time_waivers(@trip1, @stop_time_updates_by_trip) == expected
    end

    test "does not include stop time updates without block waiver causes" do
      trip1_stop1_update_nil_cause = %{
        @trip1_stop1_update
        | cause_id: nil,
          cause_description: nil,
          remark: nil
      }

      trip1_stop2_update_empty_cause = %{
        @trip1_stop2_update
        | cause_id: nil,
          cause_description: "",
          remark: ""
      }

      stop_time_updates_by_trip = %{
        @stop_time_updates_by_trip
        | @trip1.id => [trip1_stop1_update_nil_cause, trip1_stop2_update_empty_cause]
      }

      expected = [
        {1, nil},
        {2, nil},
        {3, nil}
      ]

      assert BlockWaiver.trip_stop_time_waivers(@trip1, stop_time_updates_by_trip) == expected
    end

    test "does not include stop time updates for bad transitmaster units" do
      trip1_stop1_update_bad_tm = %{
        @trip1_stop1_update
        | cause_id: 33,
          cause_description: "T - Inactive TM",
          remark: "T - Inactive TM:"
      }

      stop_time_updates_by_trip = %{
        @trip1.id => [trip1_stop1_update_bad_tm]
      }

      expected = [
        {1, nil},
        {2, nil},
        {3, nil}
      ]

      assert BlockWaiver.trip_stop_time_waivers(@trip1, stop_time_updates_by_trip) == expected
    end

    test "includes stop time updates with causes but no remark" do
      trip1_stop1_update_nil_remark = %{
        @trip1_stop1_update
        | remark: nil
      }

      trip1_stop2_update_empty_remark = %{
        @trip1_stop2_update
        | remark: ""
      }

      stop_time_updates_by_trip = %{
        @stop_time_updates_by_trip
        | @trip1.id => [trip1_stop1_update_nil_remark, trip1_stop2_update_empty_remark]
      }

      expected = [
        {1, trip1_stop1_update_nil_remark},
        {2, trip1_stop2_update_empty_remark},
        {3, nil}
      ]

      assert BlockWaiver.trip_stop_time_waivers(@trip1, stop_time_updates_by_trip) == expected
    end
  end

  describe "is_current?/1" do
    test "true when current time is between start and end times" do
      current_time = 5
      reassign_env(:skate, :now_fn, fn -> current_time end)

      assert BlockWaiver.is_current?(%BlockWaiver{
               start_time: current_time - 1,
               end_time: current_time + 10,
               cause_id: 26,
               cause_description: "E - Diverted"
             })
    end

    test "false when current time is after end time" do
      current_time = 5
      reassign_env(:skate, :now_fn, fn -> current_time end)

      refute BlockWaiver.is_current?(%BlockWaiver{
               start_time: current_time - 4,
               end_time: current_time - 1,
               cause_id: 26,
               cause_description: "E - Diverted"
             })
    end

    test "false when current time is before start time" do
      current_time = 5
      reassign_env(:skate, :now_fn, fn -> current_time end)

      refute BlockWaiver.is_current?(%BlockWaiver{
               start_time: current_time + 1,
               end_time: current_time + 4,
               cause_id: 26,
               cause_description: "E - Diverted"
             })
    end
  end

  describe "group_consecutive_sequences/1" do
    test "removes trip_stop_time_waivers missing a waiver" do
      trip_stop_time_waivers = [{1, nil}]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == []
    end

    test "includes trip_stop_time_waivers with a waiver" do
      trip_stop_time_waiver1 = {1, @trip1_stop1_update}
      trip_stop_time_waiver2 = {2, @trip1_stop2_update}

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
        {1, @trip1_stop1_update},
        {1, @trip1_stop2_update},
        {1, @trip2_stop1_update}
      ]

      expected = [trip_stop_time_waivers]

      assert BlockWaiver.group_consecutive_sequences(trip_stop_time_waivers) == expected
    end

    test "breaks apart groups at a stop without a waiver" do
      trip_stop_time_waiver1 = {1, @trip1_stop1_update}
      trip_stop_time_waiver2 = {1, @trip1_stop2_update}

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

    test "breaks apart groups at a new waiver remark or cause" do
      trip_stop_time_waiver1 = {1, @trip1_stop1_update}

      trip_stop_time_waiver2 = {1, %StopTimeUpdate{@trip1_stop2_update | remark: "new remark"}}

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
      trip_stop_time_waiver1 = {0, @trip1_stop1_update}
      trip_stop_time_waiver2 = {3601, @trip1_stop2_update}

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
        {1, @trip1_stop1_update},
        {2, @trip1_stop2_update}
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
