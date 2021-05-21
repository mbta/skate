defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers
  import Skate.Factory

  alias Realtime.Server

  @vehicle build(:vehicle,
             route_id: "1",
             id: "v1",
             label: "v1-label",
             run_id: "123-9048",
             block_id: "vehicle_block",
             operator_id: "71041",
             operator_first_name: "FRANK",
             operator_last_name: "FRANCIS",
             operator_name: "FRANCIS"
           )

  @vehicle_on_inactive_block build(:vehicle,
                               route_id: "1",
                               block_is_active: false,
                               block_id: "inactive_block",
                               id: "v2",
                               label: "v2-label",
                               run_id: "456-7890"
                             )

  @ghost build(:ghost, block_id: "ghost_block")

  @shuttle build(:vehicle,
             id: "shuttle",
             label: "shuttle",
             run_id: "9990555",
             block_id: "shuttle_block",
             route_id: nil,
             trip_id: "t3"
           )

  @vehicles_by_route_id %{
    "1" => [@vehicle, @ghost]
  }

  setup do
    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    :ok
  end

  describe "update" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      %{server_pid: server_pid}
    end

    test "accepts vehicle positions", %{server_pid: server_pid} do
      assert Server.update({@vehicles_by_route_id, []}, server_pid) == :ok
    end
  end

  describe "subscribe_to_route" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      Server.update({@vehicles_by_route_id, []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      vehicles_and_ghosts = Server.subscribe_to_route("1", server_pid)
      assert vehicles_and_ghosts == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({@vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions"
      )

      assert Server.lookup(lookup_args) == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get repeated messages", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({@vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, _},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update({@vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions the second time"
      )

      assert Server.lookup(lookup_args) == [@vehicle, @ghost]
    end

    test "inactive routes have all their vehicle data removed", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({%{}, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client received vehicle positions"
      )

      assert Server.lookup(lookup_args) == []
    end

    test "vehicles on inactive blocks are removed", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update({%{"1" => [@vehicle_on_inactive_block]}, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client received vehicle positions"
      )

      assert Server.lookup(lookup_args) == []
    end
  end

  describe "subscribe_to_block_ids" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      Server.update({@vehicles_by_route_id, []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      vehicles_and_ghosts = Server.subscribe_to_block_ids([@vehicle.block_id], server_pid)
      assert vehicles_and_ghosts == [@vehicle]
    end

    test "can subscribe to multiple block IDs", %{server_pid: server_pid} do
      vehicles_and_ghosts =
        Server.subscribe_to_block_ids([@vehicle.block_id, @ghost.block_id], server_pid)

      assert vehicles_and_ghosts == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe_to_block_ids([@vehicle.block_id], server_pid)

      Server.update({@vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions"
      )

      assert Server.lookup(lookup_args) == [@vehicle]
    end

    test "clients subscribed to block IDs get repeated messages", %{server_pid: server_pid} do
      Server.subscribe_to_block_ids([@vehicle.block_id], server_pid)

      Server.update({@vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, _},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update({@vehicles_by_route_id, []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions the second time"
      )

      assert Server.lookup(lookup_args) == [@vehicle]
    end

    test "inactive blocks have all their vehicle data removed", %{server_pid: server_pid} do
      Server.subscribe_to_block_ids([@vehicle.block_id], server_pid)

      Server.update({%{}, []}, server_pid)

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

      :ok = Server.update({%{}, [@shuttle]}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get all shuttles upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_all_shuttles(pid) == [@shuttle]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_all_shuttles(pid)

      Server.update({%{}, [@shuttle, @shuttle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle, @shuttle]
    end
  end

  describe "subscribe_to_search" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update({@vehicles_by_route_id, [@shuttle]}, server_pid)

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

      Server.update({%{}, [@shuttle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle]
    end

    test "does not receive duplicate vehicles", %{server_pid: pid} do
      Server.subscribe_to_search("90", :all, pid)

      Server.update({%{}, [@shuttle, @shuttle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle]
    end

    test "vehicles on inactive blocks are included", %{server_pid: pid} do
      Server.subscribe_to_search("v2-label", :vehicle, pid)

      Server.update({%{"1" => [@vehicle_on_inactive_block]}, []}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert Server.lookup(lookup_args) == [@vehicle_on_inactive_block]
    end
  end

  describe "lookup/2" do
    setup do
      ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

      :ets.insert(ets, {{:route_id, "1"}, [@vehicle, @ghost]})
      :ets.insert(ets, {{:trip_id, "t1"}, @vehicle})
      :ets.insert(ets, {{:trip_id, "t2"}, @ghost})
      :ets.insert(ets, {:all_vehicles, [@vehicle, @shuttle]})
      :ets.insert(ets, {:all_shuttles, [@shuttle]})
      :ets.insert(ets, {{:block_id, @vehicle.block_id}, @vehicle})

      {:ok, %{ets: ets}}
    end

    test "fetches vehicles by route from the ets table", %{ets: ets} do
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

    test "fetches a vehicle by trip ID from the ets table", %{ets: ets} do
      assert Server.lookup({ets, {:trip_id, "t1"}}) == @vehicle
      assert Server.lookup({ets, {:trip_id, "t2"}}) == @ghost
    end

    test "fetches vehicles by block ID from the ets table", %{ets: ets} do
      assert Server.lookup({ets, {:block_ids, [@vehicle.block_id]}}) == [@vehicle]
    end

    test "searches all vehicles by any of run, vehicle, or operator", %{ets: ets} do
      run_search_params = %{
        text: "123",
        property: :all
      }

      vehicle_search_params = %{
        text: "v1-label",
        property: :all
      }

      operator_search_params = %{
        text: "franc",
        property: :all
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
        text: "franc",
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
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %Server{ets: make_ref()}

      response = Server.handle_info({make_ref(), []}, state)

      assert response == {:noreply, state}
    end

    test "checks data status, filtering out ghosts" do
      ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

      :ets.insert(ets, {:all_vehicles, [@vehicle, @ghost]})

      state = %Server{ets: ets}

      pid = self()

      reassign_env(:skate, :data_status_fn, fn vehicles ->
        send(pid, vehicles)
        :outage
      end)

      Server.handle_info(:check_data_status, state)

      assert_received([%Realtime.Vehicle{}])
    end
  end

  describe "peek_at_vehicles/2" do
    test "looks up vehicles active on the given trip IDs" do
      {:ok, server_pid} = Server.start_link([])
      Server.update({@vehicles_by_route_id, [@shuttle]}, server_pid)

      assert Server.peek_at_vehicles([], server_pid) == []
      assert Server.peek_at_vehicles(["no_such_run"], server_pid) == []
      assert Server.peek_at_vehicles(["123-9048"], server_pid) == [@vehicle]
      assert Server.peek_at_vehicles(["123-9049"], server_pid) == [@ghost]
      assert Server.peek_at_vehicles(["123-9048", "123-9049"], server_pid) == [@vehicle, @ghost]

      assert Server.peek_at_vehicles(["123-9048", "no_such_run", "123-9049"], server_pid) == [
               @vehicle,
               @ghost
             ]
    end
  end
end
