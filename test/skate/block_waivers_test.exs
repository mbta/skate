defmodule Skate.BlockWaiversTest do
  use Skate.DataCase

  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Test.Support.Helpers, only: [reassign_env: 3, set_log_level: 1]
  import Skate.Factory

  # alias Notifications.Notification
  # alias Notifications.NotificationServer
  alias Realtime.BlockWaiver
  alias Realtime.{Vehicle, Ghost}

  @block build(
           :block,
           id: "block1",
           service_id: "service1",
           start_time: 1,
           end_time: 1000,
           pieces: [
             build(:piece,
               trips: [
                 build(
                   :trip,
                   id: "trip1",
                   block_id: "block1",
                   run_id: "run1",
                   route_id: "39",
                   start_time: 50,
                   end_time: 200
                 ),
                 build(
                   :trip,
                   id: "trip2",
                   block_id: "block1",
                   run_id: "run2",
                   route_id: "2",
                   start_time: 400,
                   end_time: 800
                 ),
                 build(
                   :trip,
                   id: "not_covered_by_waiver",
                   block_id: "block1",
                   run_id: "run3",
                   route_id: "3",
                   start_time: 501,
                   end_time: 800
                 )
               ]
             )
           ]
         )

  @ghost %Ghost{
    id: "ghost1",
    direction_id: 0,
    route_id: "SL9001",
    trip_id: "ghost-trip-1",
    headsign: "headsign",
    block_id: "block",
    run_id: "ghost-run-1",
    via_variant: "X",
    layover_departure_time: nil,
    scheduled_timepoint_status: %{
      timepoint_id: "t2",
      fraction_until_timepoint: 0.5
    },
    route_status: :on_route
  }

  @operator_last_name build(:last_name)

  @vehicle %Vehicle{
    id: "y0507",
    label: "0507",
    timestamp: 123,
    timestamp_by_source: %{"swiftly" => 123},
    latitude: 0.0,
    longitude: 0.0,
    direction_id: "234",
    route_id: "SL9001",
    trip_id: "456",
    bearing: nil,
    block_id: nil,
    operator_id: build(:operator_id),
    operator_first_name: build(:first_name),
    operator_last_name: @operator_last_name,
    operator_name: @operator_last_name,
    operator_logon_time: nil,
    overload_offset: nil,
    run_id: "123-4567",
    is_shuttle: false,
    is_overload: false,
    is_off_course: false,
    is_revenue: true,
    layover_departure_time: nil,
    block_is_active: true,
    sources: MapSet.new(["swiftly"]),
    data_discrepancies: [],
    stop_status: %{
      stop_id: "567",
      stop_name: "567"
    },
    timepoint_status: %{
      timepoint_id: "tp2",
      fraction_until_timepoint: 0.4
    },
    route_status: :on_route,
    end_of_trip_type: :another_trip
  }

  # See Realtime.BlockWaiver for the full mapping
  @reasons_map %{
    1 => {"J - Other", :other},
    23 => {"B - Manpower", :manpower},
    25 => {"D - Disabled", :disabled},
    26 => {"E - Diverted", :diverted},
    27 => {"F - Traffic", :traffic},
    28 => {"G - Accident", :accident},
    30 => {"I - Operator Error", :operator_error},
    31 => {"K - Adjusted", :adjusted}
  }

  # Midnight Eastern time, 8/17/2020
  @midnight 1_597_636_800

  def assert_n_notifications_in_db(expected_n) do
    assert expected_n == Skate.Repo.aggregate(Notifications.Db.Notification, :count)
  end

  def assert_block_waiver_notification_logged(log, %{
        cause_atom: cause_atom,
        start_time: start_time,
        created_at_string: created_at_string
      }) do
    assert log =~ "reason=#{cause_atom}"
    assert log =~ "created_at=#{created_at_string}"
    assert log =~ "start_time=#{start_time}"
    assert log =~ ~s(route_ids=["39", "2"])
    assert log =~ ~s(run_ids=["run1", "run2"])
    assert log =~ ~s(trip_ids=["trip1", "trip2"])
  end

  def assert_block_waiver_notification(
        cause_atom,
        cause_description,
        cause_id,
        _server,
        opts \\ []
      ) do
    start_time = @midnight + 100

    set_log_level(:info)

    log =
      capture_log([level: :info], fn ->
        Skate.BlockWaivers.create_block_waiver_notifications(
          waiver_map(cause_id, cause_description)
        )

        operator_name = Keyword.get(opts, :operator_name)

        operator_id = Keyword.get(opts, :operator_id)

        route_id_at_creation = Keyword.get(opts, :route_id_at_creation)

        notification_id = Keyword.get(opts, :notification_id)

        # if notification_id do
        #   assert_receive(
        #     {:notification,
        #      %Notifications.Notification{
        #        id: ^notification_id,
        #        content: %Notifications.Db.BlockWaiver{
        #          reason: ^cause_atom,
        #          route_ids: ["39", "2"],
        #          run_ids: ["run1", "run2"],
        #          trip_ids: ["trip1", "trip2"],
        #          operator_name: ^operator_name,
        #          operator_id: ^operator_id,
        #          route_id_at_creation: ^route_id_at_creation,
        #          start_time: ^start_time
        #        }
        #      }},
        #     5000
        #   )
        # else
        #   assert_receive(
        #     {:notification,
        #      %Notifications.Notification{
        #        content: %Notifications.Db.BlockWaiver{
        #          reason: ^cause_atom,
        #          route_ids: ["39", "2"],
        #          run_ids: ["run1", "run2"],
        #          trip_ids: ["trip1", "trip2"],
        #          operator_name: ^operator_name,
        #          operator_id: ^operator_id,
        #          route_id_at_creation: ^route_id_at_creation,
        #          start_time: ^start_time
        #        }
        #      }},
        #     5000
        #   )
        # end
      end)

    log_expected = Keyword.get(opts, :log_expected, true)

    if log_expected,
      do:
        assert_block_waiver_notification_logged(log, %{
          cause_atom: cause_atom,
          start_time: "2020-08-17T04:01:40Z",
          created_at_string: ""
        })
  end

  def waiver_map(cause_id, cause_description) do
    %{
      {"block1", "service1"} => [
        %BlockWaiver{
          start_time: @midnight + 100,
          end_time: @midnight + 500,
          cause_id: cause_id,
          cause_description: cause_description,
          remark: "some_remark"
        },
        %BlockWaiver{
          start_time: @midnight,
          end_time: @midnight + 86_400,
          cause_id: 999,
          cause_description: "W - Whatever",
          remark: "Ignored due to unrecognized cause_description"
        }
      ]
    }
  end

  setup do
    reassign_env(:realtime, :block_fn, fn _, _ -> @block end)

    reassign_env(:realtime, :active_blocks_fn, fn _, _ ->
      %{~D[2020-08-17] => [@block]}
    end)

    route_tab1 =
      build(:route_tab, %{
        preset_name: "some routes",
        selected_route_ids: ["39"]
      })

    user = Skate.Settings.User.upsert("fake_uid", "fakeemail@test.com")

    Skate.Settings.RouteTab.update_all_for_user!(user.id, [route_tab1])

    {:ok, %{user: user}}
  end

  describe "create_block_waiver_notifications/1" do
    test "creates new notifications for waivers with recognized reason for vehicles on selected routes" do
      vehicle = @vehicle

      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [vehicle]
      end)

      # {:ok, server} = setup_server(user.id)
      server = nil

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server,
          operator_name: vehicle.operator_last_name,
          operator_id: vehicle.operator_id,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "creates new notifications for waivers with recognized reason for ghosts on selected routes" do
      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [@ghost]
      end)

      # {:ok, server} = setup_server(user.id)
      server = nil

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "creates new notifications for waivers with recognized reason when no vehicle or ghost is associated on selected routes" do
      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        []
      end)

      # {:ok, server} = setup_server(user.id)
      server = nil

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server)
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end
  end
end
