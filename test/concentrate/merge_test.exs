defmodule Concentrate.MergeTest do
  @moduledoc false
  use ExUnit.Case, async: true
  use ExUnitProperties
  import ExUnit.CaptureLog, only: [capture_log: 1]
  import Concentrate.Merge
  alias Concentrate.{MockMerge, TripUpdate, VehiclePosition}

  describe "handle_subscribe/4" do
    test "asks the producer for demand" do
      from = make_from()
      {_, state, _} = init([])
      {_, _state} = handle_subscribe(:producer, [], from, state)
      assert_received {:"$gen_producer", ^from, {:ask, 1}}
    end
  end

  describe "handle_cancel/3" do
    test "cleans up state if a producer dies" do
      from = make_from()
      {_, original_state, _} = init([])
      {_, state} = handle_subscribe(:producer, [], from, original_state)
      assert {:noreply, [], new_state} = handle_cancel({:cancel, :whatever}, from, state)
      assert original_state == new_state
    end
  end

  describe "handle_events/2" do
    test "schedules a timeout" do
      from = make_from()
      {_, state, _} = init(initial_timeout: 100, timeout: 100)
      assert state.timer
      assert_receive :timeout, 500
      {:noreply, _, state} = handle_info(:timeout, state)

      {_, state} = handle_subscribe(:producer, [], from, state)
      {:noreply, [], state} = handle_events([[], [], []], from, state)
      assert state.timer
      refute_received :timeout
      {:noreply, [], _state} = handle_events([[], [], []], from, state)
      assert_receive :timeout, 500
    end

    test "handles partial updates without replacing existing data" do
      from = make_from()
      {_, state, _} = init(initial_timeout: 100, timeout: 100)
      assert_receive :timeout, 500
      {:noreply, _, state} = handle_info(:timeout, state)

      {_, state} = handle_subscribe(:producer, [], from, state)

      # First, send a full update with two vehicles
      vehicle_1 = VehiclePosition.new(id: "v1", latitude: 1.0, longitude: 1.0, last_updated: 1)
      vehicle_2 = VehiclePosition.new(id: "v2", latitude: 2.0, longitude: 2.0, last_updated: 1)
      {:noreply, [], state} = handle_events([[vehicle_1, vehicle_2]], from, state)

      # Then send a partial update with one vehicle
      vehicle_3 = VehiclePosition.new(id: "v3", latitude: 3.0, longitude: 3.0, last_updated: 2)
      {:noreply, [], state} = handle_events([{:partial, [vehicle_3]}], from, state)

      # Verify all three vehicles are present
      {:noreply, [grouped], _state} = handle_info(:timeout, state)

      vehicle_ids =
        grouped
        |> Enum.flat_map(fn {_tu, vps, _stus} -> vps end)
        |> Enum.map(&VehiclePosition.id/1)
        |> Enum.sort()

      assert vehicle_ids == ["v1", "v2", "v3"]
    end

    test "partial updates can update existing items" do
      from = make_from()
      {_, state, _} = init(initial_timeout: 100, timeout: 100)
      assert_receive :timeout, 500
      {:noreply, _, state} = handle_info(:timeout, state)

      {_, state} = handle_subscribe(:producer, [], from, state)

      # First, send a full update with one vehicle
      vehicle_1 = VehiclePosition.new(id: "v1", latitude: 1.0, longitude: 1.0, last_updated: 1)
      {:noreply, [], state} = handle_events([[vehicle_1]], from, state)

      # Then send a partial update that updates the same vehicle
      vehicle_1_updated =
        VehiclePosition.new(id: "v1", latitude: 10.0, longitude: 10.0, last_updated: 2)

      {:noreply, [], state} = handle_events([{:partial, [vehicle_1_updated]}], from, state)

      # Verify the vehicle was updated
      {:noreply, [grouped], _state} = handle_info(:timeout, state)

      vehicles = Enum.flat_map(grouped, fn {_tu, vps, _stus} -> vps end)

      assert length(vehicles) == 1
      [vehicle] = vehicles
      assert VehiclePosition.latitude(vehicle) == 10.0
    end

    test "when Logging debug messages, does not crash" do
      log_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: log_level)
      end)

      Logger.configure(level: :debug)
      data = []

      events = [data]
      filters = []
      from = make_from()
      {_, state, _} = init(filters: filters)
      {_, state} = handle_subscribe(:producer, [], from, state)
      {:noreply, [], state} = handle_events(events, from, state)

      log =
        capture_log(fn ->
          handle_info(:timeout, state)
        end)

      refute log == ""
    end

    property "with multiple sources, returns the merged data" do
      check all(multi_source_mergeables <- list_of_mergeables()) do
        {_, state, _} = init([])

        expected =
          multi_source_mergeables
          |> List.flatten()
          |> MockMerge.merge()
          |> group()

        acc = {:noreply, [], state}

        {:noreply, [], state} =
          Enum.reduce(multi_source_mergeables, acc, fn mergeables, {_, _, state} ->
            from = make_from()
            {_, state} = handle_subscribe(:producer, [], from, state)
            handle_events([mergeables], from, state)
          end)

        {:noreply, [actual], _state} = handle_info(:timeout, state)

        assert Enum.sort(actual) == Enum.sort(expected)
      end
    end

    test "asks sources from which we've received data for more" do
      producer_0 = make_from()
      producer_1 = make_from()
      {_, state, _} = init([])
      {_, state} = handle_subscribe(:producer, [], producer_0, state)
      {_, state} = handle_subscribe(:producer, [], producer_1, state)
      clear_mailbox()
      {:noreply, _, state} = handle_events([[]], producer_0, state)
      {:noreply, _, _state} = handle_info(:timeout, state)
      assert_received {:"$gen_producer", ^producer_0, {:ask, 1}}
      refute_received {:"$gen_producer", ^producer_1, _}
    end
  end

  describe "handle_info/2" do
    @tag :capture_log
    test "ignores unknown messages" do
      assert handle_info(:unknown, :state) == {:noreply, [], :state}
    end
  end

  describe "group/1" do
    test "groups trip updates" do
      parsed = [
        %TripUpdate{
          trip_id: "1",
          schedule_relationship: :CANCELED
        },
        %TripUpdate{
          trip_id: "2",
          schedule_relationship: :SCHEDULED
        },
        %Concentrate.VehiclePosition{
          id: "EM",
          trip_id: "1"
        },
        %Concentrate.VehiclePosition{
          id: "FN",
          trip_id: "2"
        }
      ]

      expected = [
        {%Concentrate.TripUpdate{
           direction_id: nil,
           route_id: nil,
           schedule_relationship: :CANCELED,
           start_date: nil,
           start_time: nil,
           trip_id: "1"
         },
         [
           %Concentrate.VehiclePosition{
             block_id: nil,
             id: "EM",
             trip_id: "1"
           }
         ], []},
        {%Concentrate.TripUpdate{
           direction_id: nil,
           route_id: nil,
           schedule_relationship: :SCHEDULED,
           start_date: nil,
           start_time: nil,
           trip_id: "2"
         },
         [
           %Concentrate.VehiclePosition{
             id: "FN",
             trip_id: "2"
           }
         ], []}
      ]

      assert group(parsed) == expected
    end
  end

  defp make_from do
    {self(), make_ref()}
  end

  defp list_of_mergeables do
    list_of(list_of_vehicles(), min_length: 1, max_length: 3)
  end

  defp list_of_vehicles do
    gen all(vehicles <- list_of(vehicle())) do
      Enum.uniq_by(vehicles, &VehiclePosition.id/1)
    end
  end

  defp vehicle do
    gen all(
          last_updated <- StreamData.positive_integer(),
          vehicle_id <- StreamData.string(:ascii)
        ) do
      VehiclePosition.new(
        id: vehicle_id,
        last_updated: last_updated,
        latitude: 1.0,
        longitude: 1.0
      )
    end
  end

  defp clear_mailbox do
    receive do
      _ -> clear_mailbox()
    after
      0 -> :ok
    end
  end
end
