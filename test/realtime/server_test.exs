defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true

  alias Concentrate.StopTimeUpdate
  alias Realtime.{Ghost, Server, Vehicle}

  @vehicle %Vehicle{
    id: "v1",
    label: "v1-label",
    timestamp: 1_558_121_727,
    latitude: 42.3408556,
    longitude: -71.0642766,
    direction_id: 0,
    route_id: "1",
    trip_id: "t1",
    bearing: nil,
    block_id: "A505-106",
    operator_id: "71041",
    operator_name: "FRANK",
    run_id: "123-9048",
    headway_secs: 600,
    headway_spacing: :ok,
    is_off_course: false,
    layover_departure_time: nil,
    block_is_active: true,
    sources: MapSet.new(["swiftly"]),
    data_discrepancies: [],
    stop_status: %{
      stop_id: "s1"
    },
    timepoint_status: %{
      timepoint_id: "tp1",
      fraction_until_timepoint: 0.2
    },
    route_status: :on_route,
    end_of_trip_type: :another_trip
  }

  @ghost %Ghost{
    id: "ghost-trip",
    direction_id: 0,
    route_id: "1",
    trip_id: "trip",
    headsign: "headsign",
    block_id: "block",
    run_id: "123-9049",
    via_variant: "X",
    layover_departure_time: nil,
    scheduled_timepoint_status: %{
      timepoint_id: "t2",
      fraction_until_timepoint: 0.5
    },
    route_status: :on_route
  }

  @shuttle %{@vehicle | id: "shuttle", label: "shuttle", run_id: "9990555", route_id: nil}

  @vehicles_by_route_id %{
    "1" => [@vehicle, @ghost]
  }

  @stop_time_update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    remark: nil,
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "s1",
    stop_sequence: nil,
    track: nil,
    trip_id: "t1",
    uncertainty: nil
  }

  @stop_time_updates_by_trip_id %{
    "t1" => [@stop_time_update]
  }

  setup do
    start_supervised({Registry, keys: :duplicate, name: Realtime.Server.registry_name()})
    :ok
  end

  describe "update" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      %{server_pid: server_pid}
    end

    test "accepts vehicle positions", %{server_pid: server_pid} do
      assert Server.update({:vehicle_positions, @vehicles_by_route_id, []}, server_pid) == :ok
    end

    test "accepts stop time updates", %{server_pid: server_pid} do
      assert Server.update({:stop_time_updates, @stop_time_updates_by_trip_id}, server_pid) == :ok
    end
  end

  describe "subscribe_to_route" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      Server.update({:vehicle_positions, @vehicles_by_route_id, []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      vehicles_and_ghosts = Server.subscribe_to_route("1", server_pid)
      assert vehicles_and_ghosts == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({:vehicle_positions, @vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions"
      )

      assert Server.lookup(lookup_args) == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get repeated messages", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({:vehicle_positions, @vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, _},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update({:vehicle_positions, @vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions the second time"
      )

      assert Server.lookup(lookup_args) == [@vehicle, @ghost]
    end

    test "inactive routes have all their vehicle data removed", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({:vehicle_positions, %{}, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client received vehicle positions"
      )

      assert Server.lookup(lookup_args) == []
    end
  end

  describe "subscribe_to_all_shuttles" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update({:vehicle_positions, %{}, [@shuttle]}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get all shuttles upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_all_shuttles(pid) == [@shuttle]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_all_shuttles(pid)

      Server.update({:vehicle_positions, %{}, [@shuttle, @shuttle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle, @shuttle]
    end
  end

  describe "subscribe_to_search" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update({:vehicle_positions, @vehicles_by_route_id, [@shuttle]}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get search results upon subscribing", %{server_pid: pid} do
      results = Server.subscribe_to_search("90", :all, pid)

      assert Enum.member?(results, @vehicle)
      assert Enum.member?(results, @ghost)
      assert Enum.member?(results, @shuttle)
    end

    test "clients get updated search results pushed to them", %{server_pid: pid} do
      Server.subscribe_to_search("90", :all, pid)

      Server.update({:vehicle_positions, %{}, [@shuttle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle]
    end

    test "does not receive duplicate vehicles", %{server_pid: pid} do
      Server.subscribe_to_search("90", :all, pid)

      Server.update({:vehicle_positions, %{}, [@shuttle, @shuttle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle]
    end
  end

  describe "stop_time_updates_for_trip" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update({:stop_time_updates, @stop_time_updates_by_trip_id}, server_pid)

      %{server_pid: server_pid}
    end

    test "returns the stop time updates for the requested trip", %{server_pid: server_pid} do
      assert Server.stop_time_updates_for_trip("t1", server_pid) == [@stop_time_update]
    end

    test "returns an empty list if there are no stop time updates for this trip", %{
      server_pid: server_pid
    } do
      assert Server.stop_time_updates_for_trip("missing", server_pid) == []
    end
  end

  describe "lookup/2" do
    setup do
      ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

      :ets.insert(ets, {{:route_id, "1"}, [@vehicle, @ghost]})
      :ets.insert(ets, {:all_vehicles, [@vehicle, @shuttle]})
      :ets.insert(ets, {:all_shuttles, [@shuttle]})
      :ets.insert(ets, {{:trip_id, "t1"}, [@stop_time_update]})

      {:ok, %{ets: ets}}
    end

    test "fetches shuttles by route from the ets table", %{ets: ets} do
      assert Server.lookup({ets, {:route_id, "1"}}) == [@vehicle, @ghost]
    end

    test "returns empty data when the route is not found", %{ets: ets} do
      assert Server.lookup({ets, {:route_id, "2"}}) == []
    end

    test "fetches all vehicles, on routes and shuttles", %{ets: ets} do
      assert Server.lookup({ets, :all_vehicles}) == [@vehicle, @shuttle]
    end

    test "fetches all shuttles from the ets table", %{ets: ets} do
      assert Server.lookup({ets, :all_shuttles}) == [@shuttle]
    end

    test "searches all vehicles by any of run, vehicle, or operator", %{ets: ets} do
      run_search_params = %{
        text: "123",
        property: :all
      }

      vehicle_search_params = %{
        text: "123",
        property: :run
      }

      operator_search_params = %{
        text: "frank",
        property: :operator
      }

      assert Server.lookup({ets, {:search, run_search_params}}) == [@vehicle]
      assert Server.lookup({ets, {:search, vehicle_search_params}}) == [@vehicle]
      assert Enum.member?(Server.lookup({ets, {:search, operator_search_params}}), @vehicle)
    end

    test "searches all vehicles by run ID", %{ets: ets} do
      search_params = %{
        text: "123",
        property: :run
      }

      assert Server.lookup({ets, {:search, search_params}}) == [@vehicle]
    end

    test "searches all vehicles by vehicle ID", %{ets: ets} do
      search_params = %{
        text: "v1",
        property: :vehicle
      }

      assert Server.lookup({ets, {:search, search_params}}) == [@vehicle]
    end

    test "searches all vehicles by operator name", %{ets: ets} do
      search_params = %{
        text: "frank",
        property: :operator
      }

      results = Server.lookup({ets, {:search, search_params}})

      assert Enum.member?(results, @vehicle)
    end

    test "searches all vehicles by operator ID", %{ets: ets} do
      search_params = %{
        text: "710",
        property: :operator
      }

      results = Server.lookup({ets, {:search, search_params}})

      assert Enum.member?(results, @vehicle)
    end

    test "fetches stop time updates by trip ID", %{ets: ets} do
      assert Server.lookup({ets, {:trip_id, "t1"}}) == [@stop_time_update]
    end
  end

  describe "update_stop_time_updates/2" do
    setup do
      ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

      :ets.insert(ets, {{:trip_id, "t1"}, [@stop_time_update]})

      {:ok, %{ets: ets}}
    end

    test "removes data for trips that no longer contain stop time updates", %{ets: ets} do
      assert {ets, {:trip_id, "t1"}} |> Server.lookup() |> length() == 1

      Server.update_stop_time_updates(%Server{ets: ets}, %{})

      assert {ets, {:trip_id, "t1"}} |> Server.lookup() |> length() == 0
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %Server{ets: make_ref()}

      response = Server.handle_info({make_ref(), []}, state)

      assert response == {:noreply, state}
    end
  end
end
