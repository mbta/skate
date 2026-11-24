defmodule Skate.Radio.VehicleDataTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureLog
  import Skate.Factory

  alias Realtime.Server
  alias Skate.Radio.VehicleData

  setup do
    start_supervised!({Phoenix.PubSub, name: Server.pubsub_name()})
    start_supervised!({Server, name: Server.default_name()})

    missing = make_ref()
    previous_schedule = :persistent_term.get(Schedule, missing)

    on_exit(fn ->
      if previous_schedule == missing do
        :persistent_term.erase(Schedule)
      else
        :persistent_term.put(Schedule, previous_schedule)
      end
    end)

    :persistent_term.put(
      Schedule,
      {:loaded,
       %Schedule.Data{
         routes: [
           build(:gtfs_route,
             id: "39",
             name: "39",
             direction_names: %{0 => "Outbound", 1 => "Inbound"}
           )
         ]
       }}
    )

    vehicle =
      build(:vehicle,
        id: "y1714",
        label: "1714",
        route_id: "39",
        block_id: "B36-173",
        direction_id: 0,
        via_variant: "A",
        stop_status: %{stop_id: "23391", stop_name: "Back Bay"},
        operator_id: "12345",
        operator_first_name: " First ",
        operator_last_name: "Last",
        operator_name: "Last",
        run_id: "122-1065",
        schedule_adherence_secs: 420
      )

    %{vehicle: vehicle}
  end

  test "fetch returns the raw vehicle", %{vehicle: vehicle} do
    put_vehicle(vehicle)
    assert {:ok, ^vehicle} = VehicleData.fetch(vehicle.id)
  end

  test "returns the exact JSON-ready field set with schedule enrichment", %{vehicle: vehicle} do
    data = VehicleData.map_vehicle_fields(vehicle)

    assert %{
             "routeId" => "39",
             "routeName" => "39",
             "garage" => "Arborway",
             "direction" => "Outbound",
             "variant" => "A",
             "currentLocation" => "Back Bay",
             "operatorBadge" => "12345",
             "operatorName" => "First Last",
             "runNumber" => "122-1065",
             "adherence" => "7 min late"
           } == data

    assert data == data |> Jason.encode!() |> Jason.decode!()
  end

  test "finds logged-out vehicles and represents missing assignments as null", %{vehicle: vehicle} do
    vehicle = %{
      vehicle
      | route_id: nil,
        block_id: nil,
        direction_id: nil,
        via_variant: "_",
        stop_status: %{stop_id: nil, stop_name: nil},
        operator_id: nil,
        operator_first_name: "",
        operator_last_name: nil,
        run_id: nil,
        schedule_adherence_secs: nil
    }

    Server.update_vehicles({%{}, [], [vehicle]})
    assert {:ok, ^vehicle} = VehicleData.fetch(vehicle.id)
    data = VehicleData.map_vehicle_fields(vehicle)

    assert data
           |> Map.values()
           |> Enum.all?(&is_nil/1)
  end

  test "retains available fields when the route is unknown", %{vehicle: vehicle} do
    data =
      VehicleData.map_vehicle_fields(%{vehicle | route_id: "unknown", operator_first_name: nil})

    assert data["routeId"] == "unknown"
    assert data["routeName"] == nil
    assert data["direction"] == nil
    assert data["operatorName"] == "Last"
    assert data["garage"] == "Arborway"
  end

  test "uses the route-specific direction name", %{vehicle: vehicle} do
    assert %{"direction" => "Inbound"} =
             VehicleData.map_vehicle_fields(%{vehicle | direction_id: 1})
  end

  test "handles blank operator fields, unknown direction, and absent stop status", %{
    vehicle: vehicle
  } do
    data =
      VehicleData.map_vehicle_fields(%{
        vehicle
        | operator_id: " ",
          operator_first_name: " ",
          operator_last_name: "",
          run_id: "",
          direction_id: nil,
          via_variant: nil,
          stop_status: nil
      })

    for key <- [
          "operatorBadge",
          "operatorName",
          "runNumber",
          "direction",
          "variant",
          "currentLocation"
        ] do
      assert data[key] == nil
    end
  end

  for {seconds, expected} <- [
        {-121, "3 min early"},
        {-60, "1 min early"},
        {0, "On time"},
        {60, "1 min late"},
        {420, "7 min late"}
      ] do
    test "formats adherence of #{seconds} seconds", %{vehicle: vehicle} do
      data =
        VehicleData.map_vehicle_fields(%{vehicle | schedule_adherence_secs: unquote(seconds)})

      assert data["adherence"] == unquote(expected)
    end
  end

  test "omits invalid adherence for off-course and shuttle vehicles", %{vehicle: vehicle} do
    for attrs <- [%{is_off_course: true}, %{is_shuttle: true}] do
      assert %{"adherence" => nil} = VehicleData.map_vehicle_fields(struct!(vehicle, attrs))
    end
  end

  test "returns an explicit error for missing vehicles and does not match labels", %{
    vehicle: vehicle
  } do
    put_vehicle(vehicle)

    assert capture_log(fn ->
             assert {:error, :vehicle_not_found} = VehicleData.fetch("missing")
             assert {:error, :vehicle_not_found} = VehicleData.fetch(vehicle.label)
           end) =~ "vehicle not found"
  end

  test "does not map ghost vehicles" do
    ghost = build(:ghost)
    Server.update_vehicles({%{ghost.route_id => [ghost]}, [], []})

    assert capture_log(fn ->
             assert {:error, :vehicle_not_found} = VehicleData.fetch(ghost.id)
           end) =~ "vehicle not found"
  end

  test "returns an explicit error for invalid IDs" do
    assert capture_log(fn ->
             for id <- [nil, "", 1714] do
               assert {:error, :invalid_vehicle_id} = VehicleData.fetch(id)
             end
           end) =~ "invalid vehicle ID"
  end

  describe "merge_and_validate_data/1" do
    setup do
      %{
        rtt_data: %{
          "RadioMessageID" => 100,
          "Initiator" => %{"UnitID" => 501, "Alias" => "ALBANY-123456"},
          "CurrentGroup" => %{"Alias" => "Test1"},
          "MessagePriority" => 2,
          "InitialTimeStamp" => "2026-09-22T15:51:24.8790282-04:00",
          "UpdateTimeStamp" => "2026-09-22T15:52:32.3400206-04:00",
          "Alias" => "Bus_RTT"
        }
      }
    end

    test "maps RTT fields without accessing realtime data", %{rtt_data: rtt_data} do
      stop_supervised!(Server)

      assert {:ok, fields} = VehicleData.map_rtt_fields(rtt_data)
      assert fields["id"] == "100"
      assert fields["vehicleId"] == "y501"
      assert fields["talkGroup"] == "Test1"
      refute Map.has_key?(fields, "routeId")
    end

    test "returns the exact RTT call field set with default type and status", %{
      vehicle: vehicle,
      rtt_data: rtt_data
    } do
      put_vehicle(%{vehicle | id: "y501"})

      assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)

      assert data == %{
               "id" => "100",
               "callType" => "RTT",
               "talkGroup" => "Test1",
               "routeId" => "39",
               "routeName" => "39",
               "vehicleId" => "y501",
               "garage" => "Arborway",
               "receivedAt" => rtt_data["InitialTimeStamp"],
               "direction" => "Outbound",
               "variant" => "A",
               "currentLocation" => "Back Bay",
               "operatorBadge" => "12345",
               "operatorName" => "First Last",
               "runNumber" => "122-1065",
               "adherence" => "7 min late",
               "respondedBy" => nil,
               "answeredAt" => nil,
               "markedDoneAt" => nil,
               "status" => "active"
             }

      assert data == data |> Jason.encode!() |> Jason.decode!()
    end

    test "maps priority zero to PRTT", %{vehicle: vehicle, rtt_data: rtt_data} do
      put_vehicle(%{vehicle | id: "y501"})

      assert {:ok, data} =
               VehicleData.merge_and_validate_data(Map.put(rtt_data, "MessagePriority", 0))

      assert data["callType"] == "PRTT"
    end

    test "allows a missing talk group as nil", %{vehicle: vehicle, rtt_data: rtt_data} do
      put_vehicle(%{vehicle | id: "y501"})

      for group <- [nil, %{}, %{"Alias" => nil}] do
        assert {:ok, data} =
                 VehicleData.merge_and_validate_data(Map.put(rtt_data, "CurrentGroup", group))

        assert data["talkGroup"] == nil
      end

      assert {:ok, data} =
               VehicleData.merge_and_validate_data(Map.delete(rtt_data, "CurrentGroup"))

      assert data["talkGroup"] == nil
    end

    test "returns null for missing vehicle assignments", %{vehicle: vehicle, rtt_data: rtt_data} do
      vehicle = %{vehicle | id: "y501", route_id: nil, block_id: nil, stop_status: nil}
      Server.update_vehicles({%{}, [], [vehicle]})

      assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)
      assert data["routeId"] == nil
      assert data["routeName"] == nil
      assert data["vehicleId"] == "y501"
    end

    test "returns null for missing optional vehicle fields", %{
      vehicle: vehicle,
      rtt_data: rtt_data
    } do
      put_vehicle(%{vehicle | id: "y501", block_id: nil, stop_status: nil})
      assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)
      assert data["garage"] == nil
      assert data["currentLocation"] == nil
    end

    test "retains vehicle fields when schedule data is unavailable", %{
      vehicle: vehicle,
      rtt_data: rtt_data
    } do
      put_vehicle(%{vehicle | id: "y501"})
      :persistent_term.put(Schedule, :not_loaded)

      assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)
      assert data["routeId"] == "39"
      assert data["garage"] == "Arborway"
      assert data["operatorName"] == "First Last"
      assert data["routeName"] == nil
      assert data["direction"] == nil
    end

    test "retains vehicle fields when the route is unknown", %{
      vehicle: vehicle,
      rtt_data: rtt_data
    } do
      put_vehicle(%{vehicle | id: "y501", route_id: "unknown"})

      assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)
      assert data["routeId"] == "unknown"
      assert data["operatorName"] == "First Last"
      assert data["routeName"] == nil
    end

    test "maps RTT fields when the realtime server is unavailable", %{rtt_data: rtt_data} do
      stop_supervised!(Server)

      assert capture_log(fn ->
               assert {:error, :vehicle_data_unavailable} = VehicleData.fetch("y501")
               assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)
               assert data["id"] == "100"
               assert data["vehicleId"] == "y501"
               assert data["talkGroup"] == "Test1"
               assert data["status"] == "active"
               refute Map.has_key?(data, "routeId")
               refute Map.has_key?(data, "operatorName")
             end) =~ "lookup unavailable"
    end

    test "rejects invalid mapped field types", %{vehicle: vehicle, rtt_data: rtt_data} do
      put_vehicle(%{vehicle | id: "y501"})
      rtt_data = put_in(rtt_data, ["CurrentGroup", "Alias"], 123)

      assert capture_log(fn ->
               assert {:error, {:invalid_rtt_data, {:invalid_field, "talkGroup"}}} =
                        VehicleData.merge_and_validate_data(rtt_data)
             end) =~ "invalid output"
    end

    test "maps RTT fields when the vehicle is missing", %{rtt_data: rtt_data} do
      assert capture_log(fn ->
               assert {:ok, data} = VehicleData.merge_and_validate_data(rtt_data)

               assert data == %{
                        "id" => "100",
                        "vehicleId" => "y501",
                        "callType" => "RTT",
                        "talkGroup" => "Test1",
                        "receivedAt" => rtt_data["InitialTimeStamp"],
                        "status" => "active",
                        "respondedBy" => nil,
                        "answeredAt" => nil,
                        "markedDoneAt" => nil
                      }

               assert {:ok, %{"callType" => "PRTT"} = priority_data} =
                        VehicleData.merge_and_validate_data(
                          rtt_data
                          |> Map.put("MessagePriority", 0)
                          |> Map.delete("CurrentGroup")
                        )

               assert priority_data["talkGroup"] == nil
             end) =~ "vehicle not found"
    end

    test "validates mapped RTT fields when the vehicle is missing", %{rtt_data: rtt_data} do
      rtt_data = put_in(rtt_data, ["CurrentGroup", "Alias"], 123)

      assert capture_log(fn ->
               assert {:error, {:invalid_rtt_data, {:invalid_field, "talkGroup"}}} =
                        VehicleData.merge_and_validate_data(rtt_data)
             end) =~ "invalid output"
    end

    test "returns an explicit error for malformed messages", %{rtt_data: rtt_data} do
      invalid_messages =
        [nil, %{}] ++
          Enum.map(
            ["RadioMessageID", "Initiator", "InitialTimeStamp", "MessagePriority"],
            &Map.delete(rtt_data, &1)
          ) ++
          [
            %{rtt_data | "RadioMessageID" => nil},
            %{rtt_data | "Initiator" => %{"UnitID" => nil}},
            %{rtt_data | "Initiator" => %{"UnitID" => ""}},
            %{rtt_data | "MessagePriority" => -1},
            %{rtt_data | "CurrentGroup" => "invalid"},
            %{rtt_data | "InitialTimeStamp" => ""}
          ]

      assert capture_log(fn ->
               for message <- invalid_messages do
                 assert {:error, :invalid_rtt_data} = VehicleData.merge_and_validate_data(message)
               end
             end) =~ "invalid RTT data"
    end
  end

  defp put_vehicle(vehicle) do
    Server.update_vehicles({%{vehicle.route_id => [vehicle]}, [], []})
  end
end
