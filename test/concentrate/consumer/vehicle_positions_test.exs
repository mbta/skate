defmodule Concentrate.Consumer.VehiclePositionsTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Concentrate.Consumer.VehiclePositions

  describe "handle_events/3" do
    @vehicle_position %Concentrate.VehiclePosition{
      bearing: 0,
      block_id: "A505-106",
      id: "y0562",
      label: "0562",
      last_updated: 1_558_121_727,
      latitude: 42.3408556,
      license_plate: nil,
      longitude: -71.0642766,
      odometer: nil,
      operator_id: build(:operator_id),
      operator_last_name: build(:last_name),
      run_id: "123-9048",
      route_id: "505",
      speed: nil,
      current_status: :IN_TRANSIT_TO,
      stop_id: "6551",
      stop_sequence: 1,
      trip_id: "39984755"
    }
    @vehicle_position_shuttle %Concentrate.VehiclePosition{
      bearing: 0,
      block_id: nil,
      id: "y0563",
      label: "0563",
      last_updated: 1_558_121_727,
      latitude: 42.3408556,
      license_plate: nil,
      longitude: -71.0642766,
      odometer: nil,
      operator_id: nil,
      operator_last_name: nil,
      run_id: "999-0000",
      route_id: nil,
      speed: nil,
      current_status: nil,
      stop_id: nil,
      stop_sequence: nil,
      trip_id: nil
    }
    @vehicle_position_logged_out %Concentrate.VehiclePosition{
      bearing: 0,
      block_id: nil,
      id: "y0564",
      label: "0564",
      last_updated: 1_558_121_727,
      latitude: 42.3408556,
      license_plate: nil,
      longitude: -71.0642766,
      odometer: nil,
      operator_id: nil,
      operator_last_name: nil,
      run_id: nil,
      route_id: nil,
      speed: nil,
      current_status: nil,
      stop_id: nil,
      stop_sequence: nil,
      trip_id: nil
    }
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)
      reassign_env(:realtime, :block_waivers_for_block_and_service_fn, fn _, _ -> [] end)

      events = [
        [
          {
            %Concentrate.TripUpdate{
              direction_id: 0,
              route_id: "505",
              schedule_relationship: :SCHEDULED,
              start_date: {2019, 5, 17},
              start_time: nil,
              trip_id: "39984755"
            },
            [@vehicle_position],
            []
          },
          {nil, [@vehicle_position_logged_out], []},
          {nil, [@vehicle_position_shuttle], []}
        ]
      ]

      {:ok, events: events}
    end

    test "returns noreply", %{events: events} do
      response = VehiclePositions.handle_events(events, nil, %{})

      assert response == {:noreply, [], %{}}
    end

    test "calls update_vehicles with the expected parameters", %{events: events} do
      %{route_id: route_id, id: vehicle_id} = @vehicle_position
      shuttle_vehicle_id = @vehicle_position_shuttle.id
      logged_out_vehicle_id = @vehicle_position_logged_out.id

      pid = self()

      reassign_env(:skate, :update_vehicles_fn, fn params ->
        send(pid, params)
      end)

      VehiclePositions.handle_events(events, nil, %{})

      assert_receive({vehicles_by_position, shuttles, logged_out_vehicles})
      assert %{^route_id => [%{id: ^vehicle_id}]} = vehicles_by_position
      assert [%{id: ^shuttle_vehicle_id}] = shuttles
      assert [%{id: ^logged_out_vehicle_id}] = logged_out_vehicles
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %{}

      response = VehiclePositions.handle_info({make_ref(), %{}}, state)
      assert response == {:noreply, [], state}
    end
  end
end
