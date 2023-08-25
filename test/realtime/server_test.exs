defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true
  import ExUnit.CaptureLog
  import Test.Support.Helpers
  import Skate.Factory

  alias Realtime.BlockWaiver
  alias Realtime.Server

  @operator_last_name build(:last_name)

  @vehicle build(:vehicle,
             route_id: "1",
             id: "v1",
             label: "v1-label",
             run_id: "123-9048",
             block_id: "vehicle1_block",
             operator_id: build(:operator_id),
             operator_first_name: build(:first_name),
             operator_last_name: @operator_last_name,
             operator_name: @operator_last_name
           )

  @pull_back_vehicle build(:vehicle,
                       route_id: "2",
                       id: "v2",
                       label: "v2-label",
                       run_id: "125-9048",
                       block_id: "vehicle2_block",
                       end_of_trip_type: :pull_back,
                       timestamp: 1
                     )

  @logged_out_vehicle build(:vehicle,
                        route_id: "1",
                        id: "v1",
                        label: "v1-label",
                        run_id: nil,
                        block_id: nil,
                        operator_id: nil,
                        operator_first_name: nil,
                        operator_last_name: nil,
                        operator_name: nil
                      )

  @vehicle_on_inactive_block build(:vehicle,
                               route_id: "1",
                               block_is_active: false,
                               block_id: "inactive_block",
                               id: "v2",
                               label: "v2-label",
                               run_id: "456-7890"
                             )

  @ghost build(:ghost, id: "g1", block_id: "ghost_block", route_id: "1")

  @shuttle build(:vehicle,
             id: "shuttle",
             label: "shuttle",
             run_id: "9990555",
             block_id: "shuttle_block",
             route_id: nil,
             trip_id: "t3"
           )

  @vehicles_by_route_id %{
    "1" => [@vehicle, @ghost],
    "2" => [@pull_back_vehicle]
  }

  @alerts_by_route_id %{
    "1" => ["Some alert", "Another alert"]
  }

  setup do
    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    :ok
  end

  describe "update_vehicles/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      %{server_pid: server_pid}
    end

    test "accepts vehicle positions", %{server_pid: server_pid} do
      assert Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid) == :ok
    end
  end

  describe "update_alerts/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      %{server_pid: server_pid}
    end

    test "accepts alerts", %{server_pid: server_pid} do
      assert Server.update_alerts(@alerts_by_route_id, server_pid) == :ok
    end
  end

  describe "subscribe_to_route" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      vehicles_and_ghosts = Server.subscribe_to_route("1", server_pid)
      assert vehicles_and_ghosts == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions"
      )

      assert Server.lookup(lookup_args) == [@vehicle, @ghost]
    end

    test "clients subscribed to a route get repeated messages", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, _},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions the second time"
      )

      assert Server.lookup(lookup_args) == [@vehicle, @ghost]
    end

    test "inactive routes have all their vehicle data removed", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update_vehicles({%{}, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client received vehicle positions"
      )

      assert Server.lookup(lookup_args) == []
    end

    test "vehicles on inactive blocks are removed", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update_vehicles({%{"1" => [@vehicle_on_inactive_block]}, [], []}, server_pid)

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

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

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

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions"
      )

      assert Server.lookup(lookup_args) == [@vehicle]
    end

    test "clients subscribed to block IDs get repeated messages", %{server_pid: server_pid} do
      Server.subscribe_to_block_ids([@vehicle.block_id], server_pid)

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, _},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client didn't receive vehicle positions the second time"
      )

      assert Server.lookup(lookup_args) == [@vehicle]
    end

    test "inactive blocks have all their vehicle data removed", %{server_pid: server_pid} do
      Server.subscribe_to_block_ids([@vehicle.block_id], server_pid)

      Server.update_vehicles({%{}, [], []}, server_pid)

      assert_receive(
        {:new_realtime_data, lookup_args},
        200,
        "Client received vehicle positions"
      )

      assert Server.lookup(lookup_args) == []
    end
  end

  describe "subscribe_to_all_pull_backs/1" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({%{"2" => [@pull_back_vehicle]}, [], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get all pull-backs upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_all_pull_backs(pid) == [@pull_back_vehicle]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_all_pull_backs(pid)

      updated_pull_back_vehicle = %{@pull_back_vehicle | timestamp: 2}

      Server.update_vehicles({%{"2" => [updated_pull_back_vehicle]}, [], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [updated_pull_back_vehicle]
    end
  end

  describe "subscribe_to_all_shuttles" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({%{}, [@shuttle], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get all shuttles upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_all_shuttles(pid) == [@shuttle]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_all_shuttles(pid)

      Server.update_vehicles({%{}, [@shuttle, @shuttle], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle, @shuttle]
    end
  end

  describe "subscribe_to_vehicle/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({@vehicles_by_route_id, [], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicle by ID upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_vehicle(@vehicle.id, pid) == [@vehicle]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_vehicle(@vehicle.id, pid)

      Server.update_vehicles({@vehicles_by_route_id, [], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@vehicle]
    end
  end

  describe "subscribe_to_vehicle_with_logged_out/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({%{}, [], [@logged_out_vehicle]}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicle by ID upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_vehicle_with_logged_out(@logged_out_vehicle.id, pid) == [
               @logged_out_vehicle
             ]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_vehicle_with_logged_out(@logged_out_vehicle.id, pid)

      Server.update_vehicles({%{}, [], [@logged_out_vehicle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@logged_out_vehicle]
    end
  end

  describe "subscribe_to_search/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({@vehicles_by_route_id, [@shuttle], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get search results upon subscribing", %{server_pid: pid} do
      results = Server.subscribe_to_search(%{property: :all, text: "90"}, pid)

      assert Enum.member?(results, @vehicle)
      assert Enum.member?(results, @ghost)
      assert Enum.member?(results, @shuttle)
    end

    test "clients get updated search results pushed to them", %{server_pid: pid} do
      Server.subscribe_to_search(%{property: :all, text: "90"}, pid)

      Server.update_vehicles({%{}, [@shuttle], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle]
    end

    test "does not receive duplicate vehicles", %{server_pid: pid} do
      Server.subscribe_to_search(%{property: :all, text: "90"}, pid)

      Server.update_vehicles({%{}, [@shuttle, @shuttle], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [@shuttle]
    end

    test "vehicles on inactive blocks are included", %{server_pid: pid} do
      Server.subscribe_to_search(%{property: :vehicle, text: "v2-label"}, pid)

      Server.update_vehicles({%{"1" => [@vehicle_on_inactive_block]}, [], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert Server.lookup(lookup_args) == [@vehicle_on_inactive_block]
    end

    test "logged out vehicles are returned when include_logged_out_vehicles is true",
         %{server_pid: pid} do
      Server.subscribe_to_search(
        %{property: :vehicle, text: "123", include_logged_out_vehicles: true},
        pid
      )

      logged_in_vehicle =
        build(:vehicle, id: "y1235", label: "1235", route_id: "1", run_id: "run_id")

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      Server.update_vehicles(
        {%{
           "1" => [logged_in_vehicle]
         }, [], [logged_out_vehicle]},
        pid
      )

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == [logged_in_vehicle, logged_out_vehicle]
    end

    test "logged out vehicles are not returned when include_logged_out_vehicles is not set",
         %{server_pid: pid} do
      Server.subscribe_to_search(%{property: :vehicle, text: "123"}, pid)

      logged_in_vehicle =
        build(:vehicle, id: "y1235", label: "1235", route_id: "1", run_id: "run_id")

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      Server.update_vehicles({%{"1" => [logged_in_vehicle]}, [], [logged_out_vehicle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert Server.lookup(lookup_args) == [logged_in_vehicle]
    end
  end

  describe "subscribe_to_limited_search/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({@vehicles_by_route_id, [@shuttle], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get limited search results upon subscribing", %{server_pid: pid} do
      assert %{matching_vehicles: [@ghost], has_more_matches: true} ==
               Server.subscribe_to_limited_search(%{property: :all, text: "90", limit: 1}, pid)
    end

    test "clients get updated limited search results pushed to them", %{server_pid: pid} do
      Server.subscribe_to_limited_search(%{property: :all, text: "90", limit: 5}, pid)

      Server.update_vehicles({%{}, [@shuttle], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert %{matching_vehicles: [@shuttle], has_more_matches: false} ==
               Server.lookup(lookup_args)
    end

    test "does not receive duplicate vehicles", %{server_pid: pid} do
      Server.subscribe_to_limited_search(%{property: :all, text: "90", limit: 5}, pid)

      Server.update_vehicles({%{}, [@shuttle, @shuttle], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert %{matching_vehicles: [@shuttle], has_more_matches: false} =
               Server.lookup(lookup_args)
    end

    test "vehicles on inactive blocks are included", %{server_pid: pid} do
      Server.subscribe_to_limited_search(%{property: :vehicle, text: "v2-label", limit: 2}, pid)

      Server.update_vehicles({%{"1" => [@vehicle_on_inactive_block]}, [], []}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert %{matching_vehicles: [@vehicle_on_inactive_block], has_more_matches: false} =
               Server.lookup(lookup_args)
    end

    test "logged out vehicles are returned when include_logged_out_vehicles is true",
         %{server_pid: pid} do
      Server.subscribe_to_limited_search(
        %{property: :vehicle, text: "123", include_logged_out_vehicles: true, limit: 4},
        pid
      )

      logged_in_vehicle =
        build(:vehicle, id: "y1235", label: "1235", route_id: "1", run_id: "run_id")

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      Server.update_vehicles(
        {%{
           "1" => [logged_in_vehicle]
         }, [], [logged_out_vehicle]},
        pid
      )

      assert_receive {:new_realtime_data, lookup_args}

      assert %{
               matching_vehicles: [logged_in_vehicle, logged_out_vehicle],
               has_more_matches: false
             } == Server.lookup(lookup_args)
    end

    test "logged out vehicles are not returned when include_logged_out_vehicles is not set",
         %{server_pid: pid} do
      Server.subscribe_to_limited_search(%{property: :vehicle, text: "123", limit: 5}, pid)

      logged_in_vehicle =
        build(:vehicle, id: "y1235", label: "1235", route_id: "1", run_id: "run_id")

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      Server.update_vehicles({%{"1" => [logged_in_vehicle]}, [], [logged_out_vehicle]}, pid)

      assert_receive {:new_realtime_data, lookup_args}

      assert %{matching_vehicles: [logged_in_vehicle], has_more_matches: false} ==
               Server.lookup(lookup_args)
    end
  end

  describe "update_limited_search_subscription/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_vehicles({@vehicles_by_route_id, [@shuttle], []}, server_pid)

      %{server_pid: server_pid}
    end

    test "when update_limited_search_subscription is called, then when vehicles update the subscribing process is pushed only a message with their latest search params",
         %{server_pid: pid} do
      first_search_params = %{property: :all, text: "90", limit: 5}
      second_search_params = %{property: :all, text: "asdf", limit: 5}

      Server.subscribe_to_limited_search(first_search_params, pid)
      Server.update_vehicles({%{}, [@shuttle], []}, pid)

      assert_receive {:new_realtime_data, {_ets_tid, {:limited_search, ^first_search_params}}}

      Server.update_limited_search_subscription(second_search_params, pid)
      Server.update_vehicles({%{}, [@shuttle], []}, pid)
      assert_receive {:new_realtime_data, {_ets_tid, {:limited_search, ^second_search_params}}}
      refute_receive {:new_realtime_data, {_ets_tid, {:limited_search, ^first_search_params}}}
    end
  end

  describe "subscribe_to_alerts/2" do
    setup do
      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_alerts(@alerts_by_route_id, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get all shuttles upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_alerts("1", pid) == @alerts_by_route_id["1"]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_alerts("1", pid)

      Server.update_alerts(%{"15" => ["Totally different alert"]}, pid)

      assert_receive {:new_realtime_data, lookup_args}
      assert Server.lookup(lookup_args) == []
    end

    test "clients subscribed to vehicles don't get updated data pushed to them", %{
      server_pid: pid
    } do
      Server.subscribe_to_route("1", pid)

      Server.update_alerts(%{"1" => ["Totally different alert"]}, pid)

      refute_receive {:new_realtime_data, _lookup_args}
    end
  end

  describe "lookup/2" do
    setup do
      ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

      :ets.insert(ets, {{:route_id, "1"}, [@vehicle, @ghost]})
      :ets.insert(ets, {{:route_id, "2"}, [@pull_back_vehicle]})
      :ets.insert(ets, {{:trip_id, "t1"}, @vehicle})
      :ets.insert(ets, {{:trip_id, "t2"}, @ghost})
      :ets.insert(ets, {:logged_in_vehicles, [@vehicle, @shuttle, @pull_back_vehicle]})
      :ets.insert(ets, {:all_shuttles, [@shuttle]})
      :ets.insert(ets, {{:block_id, @vehicle.block_id}, @vehicle})
      :ets.insert(ets, {{:alert, "1"}, ["Some alert"]})

      {:ok, %{ets: ets}}
    end

    test "fetches vehicles by route from the ets table", %{ets: ets} do
      assert Server.lookup({ets, {:route_id, "1"}}) == [@vehicle, @ghost]
    end

    test "returns empty data when the route is not found", %{ets: ets} do
      assert Server.lookup({ets, {:route_id, "3"}}) == []
    end

    test "fetches all vehicles, on routes and shuttles", %{ets: ets} do
      assert Server.lookup({ets, :logged_in_vehicles}) == [@vehicle, @shuttle, @pull_back_vehicle]
    end

    test "fetches all shuttles from the ets table", %{ets: ets} do
      assert Server.lookup({ets, :all_shuttles}) == [@shuttle]
    end

    test "fetches all pull-backs from the ets table", %{ets: ets} do
      assert Server.lookup({ets, :all_pull_backs}) == [@pull_back_vehicle]
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
        text: String.slice(@vehicle.operator_last_name, 0..-3),
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
        text: String.slice(@vehicle.operator_first_name, 0..-3),
        property: :operator
      }

      results = Server.lookup({ets, {:search, search_params}})

      assert Enum.member?(results, @vehicle)
    end

    test "searches all vehicles by operator ID", %{ets: ets} do
      vehicle = @vehicle

      search_params = %{
        text: vehicle.operator_id,
        property: :operator
      }

      results = Server.lookup({ets, {:search, search_params}})

      assert Enum.member?(results, vehicle)
    end

    test "fetches alerts by route from the ets table", %{ets: ets} do
      assert Server.lookup({ets, {:alert, "1"}}) == ["Some alert"]
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

      :ets.insert(ets, {:logged_in_vehicles, [@vehicle, @ghost]})

      state = %Server{ets: ets}

      pid = self()

      reassign_env(:skate, :data_status_fn, fn vehicles ->
        send(pid, vehicles)
        :outage
      end)

      Server.handle_info(:check_data_status, state)

      assert_received([%Realtime.Vehicle{}])
    end

    test "logs ghost stats" do
      set_log_level(:info)

      ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])
      state = %Server{ets: ets}

      current_time = 5

      reassign_env(:skate, :now_fn, fn -> current_time end)

      ghost_unexplained = build(:ghost, id: "g1", block_id: "ghost_block", route_id: "1")

      ghost_current_waiver =
        build(:ghost,
          id: "g2",
          block_id: "ghost_block_2",
          route_id: "1",
          block_waivers: [
            # one current waiver
            %BlockWaiver{
              start_time: current_time - 1,
              end_time: current_time + 10,
              cause_id: 26,
              cause_description: "E - Diverted"
            },
            # one future waiver
            %BlockWaiver{
              start_time: current_time + 10,
              end_time: current_time + 20,
              cause_id: 23,
              cause_description: "B - Manpower"
            }
          ]
        )

      ghost_past_waiver =
        build(:ghost,
          id: "g3",
          block_id: "ghost_block_3",
          route_id: "1",
          block_waivers: [
            # one past waiver
            %BlockWaiver{
              start_time: current_time - 4,
              end_time: current_time - 1,
              cause_id: 23,
              cause_description: "B - Manpower"
            }
          ]
        )

      ghost_future_waiver =
        build(:ghost,
          id: "g4",
          block_id: "ghost_block_4",
          route_id: "1",
          block_waivers: [
            %BlockWaiver{
              start_time: current_time + 10,
              end_time: current_time + 20,
              cause_id: 23,
              cause_description: "B - Manpower"
            }
          ]
        )

      :ets.insert(
        ets,
        {:logged_in_vehicles,
         [
           @vehicle,
           ghost_unexplained,
           ghost_current_waiver,
           ghost_past_waiver,
           ghost_future_waiver
         ]}
      )

      log = capture_log(fn -> Server.handle_info(:ghost_stats, state) end)
      assert log =~ "ghost_stats: explained_count=1 unexplained_count=3"
    end
  end

  describe "peek_at_vehicles_by_run_ids/2" do
    test "looks up vehicles active on the given trip IDs" do
      {:ok, server_pid} = Server.start_link([])
      Server.update_vehicles({@vehicles_by_route_id, [@shuttle], []}, server_pid)

      assert Server.peek_at_vehicles_by_run_ids([], server_pid) == []
      assert Server.peek_at_vehicles_by_run_ids(["no_such_run"], server_pid) == []
      assert Server.peek_at_vehicles_by_run_ids(["123-9048"], server_pid) == [@vehicle]
      assert Server.peek_at_vehicles_by_run_ids(["123-9049"], server_pid) == [@ghost]

      assert Server.peek_at_vehicles_by_run_ids(["123-9048", "123-9049"], server_pid) == [
               @vehicle,
               @ghost
             ]

      assert Server.peek_at_vehicles_by_run_ids(
               ["123-9048", "no_such_run", "123-9049"],
               server_pid
             ) == [
               @vehicle,
               @ghost
             ]
    end
  end

  describe "peek_at_vehicles_by_id/2" do
    test "looks up the vehicle or ghost with given ID" do
      {:ok, server_pid} = Server.start_link([])
      Server.update_vehicles({@vehicles_by_route_id, [@shuttle], []}, server_pid)

      assert Server.peek_at_vehicle_by_id("no_such_vehicle", server_pid) == []
      assert Server.peek_at_vehicle_by_id("v1", server_pid) == [@vehicle]
      assert Server.peek_at_vehicle_by_id("g1", server_pid) == [@ghost]
    end
  end

  describe "peek_at_vehicles_by_id_with_logged_out/2" do
    test "looks up the vehicle or ghost with given ID" do
      {:ok, server_pid} = Server.start_link([])
      Server.update_vehicles({%{}, [], [@logged_out_vehicle]}, server_pid)

      assert Server.peek_at_vehicle_by_id_with_logged_out("no_such_vehicle", server_pid) == []

      assert Server.peek_at_vehicle_by_id_with_logged_out(@logged_out_vehicle.id, server_pid) == [
               @logged_out_vehicle
             ]
    end
  end
end
