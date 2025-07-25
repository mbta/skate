defmodule Notifications.NotificationServerTest do
  use Skate.DataCase
  import Skate.Factory

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Notification
  alias Notifications.NotificationServer
  alias Realtime.BlockWaiver
  alias Realtime.Ghost
  alias Realtime.Vehicle
  alias Skate.Settings.RouteTab
  alias Skate.Settings.User

  import Ecto.Query
  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Skate.Factory
  import Test.Support.Helpers, only: [reassign_env: 3, set_log_level: 1]

  require Logger

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

  # Midnight Eastern time, 8/17/2020
  @midnight 1_597_636_800

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

  def assert_block_waiver_notification(
        cause_atom,
        cause_description,
        cause_id,
        server,
        opts \\ []
      ) do
    start_time = @midnight + 100

    set_log_level(:info)

    log =
      capture_log([level: :info], fn ->
        NotificationServer.new_block_waivers(
          waiver_map(cause_id, cause_description),
          server
        )

        operator_name = Keyword.get(opts, :operator_name)
        operator_id = Keyword.get(opts, :operator_id)
        route_id_at_creation = Keyword.get(opts, :route_id_at_creation)
        notification_id = Keyword.get(opts, :notification_id)

        if notification_id do
          assert_receive(
            {:notification,
             %Notifications.Notification{
               id: ^notification_id,
               content: %Notifications.Db.BlockWaiver{
                 reason: ^cause_atom,
                 route_ids: ["39", "2"],
                 run_ids: ["run1", "run2"],
                 trip_ids: ["trip1", "trip2"],
                 operator_name: ^operator_name,
                 operator_id: ^operator_id,
                 route_id_at_creation: ^route_id_at_creation,
                 start_time: ^start_time
               }
             }},
            5000
          )
        else
          assert_receive(
            {:notification,
             %Notifications.Notification{
               content: %Notifications.Db.BlockWaiver{
                 reason: ^cause_atom,
                 route_ids: ["39", "2"],
                 run_ids: ["run1", "run2"],
                 trip_ids: ["trip1", "trip2"],
                 operator_name: ^operator_name,
                 operator_id: ^operator_id,
                 route_id_at_creation: ^route_id_at_creation,
                 start_time: ^start_time
               }
             }},
            5000
          )
        end
      end)

    log_expected = Keyword.get(opts, :log_expected, true)
    if log_expected, do: assert_block_waiver_notification_logged(log, cause_atom, start_time)
  end

  def assert_block_waiver_notification_logged(log, cause_atom, start_time) do
    assert String.contains?(log, "reason: :#{cause_atom}")
    assert String.contains?(log, "route_ids: [\"39\", \"2\"]")
    assert String.contains?(log, "run_ids: [\"run1\", \"run2\"]")
    assert String.contains?(log, "trip_ids: [\"trip1\", \"trip2\"]")
    assert String.contains?(log, "start_time: #{start_time}")
  end

  def setup_server(user_id \\ nil) do
    registry_name = :new_notifications_registry
    start_supervised({Registry, keys: :duplicate, name: registry_name})
    reassign_env(:notifications, :registry, registry_name)

    {:ok, server} = NotificationServer.start_link(name: __MODULE__)

    if user_id do
      NotificationServer.subscribe(user_id, server)
    end

    {:ok, server}
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

  def assert_n_notifications_in_db(expected_n) do
    assert expected_n == Skate.Repo.aggregate(Notifications.Db.Notification, :count)
  end

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = NotificationServer.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "broadcast_notification/3" do
    setup do
      {:ok, server} = setup_server()

      %{server: server}
    end

    test "broadcasts to all subscribers if the provided user specification is :all", %{
      server: server
    } do
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(1, server)
      Notifications.NotificationServer.subscribe(2, server)

      id = 1

      Notifications.NotificationServer.broadcast_notification(
        %Notifications.Notification{
          id: id,
          created_at: nil,
          state: nil,
          content: nil
        },
        :all,
        server
      )

      assert_receive {:notification, %Notifications.Notification{id: ^id}}
      assert_receive {:notification, %Notifications.Notification{id: ^id}}
      assert_receive {:notification, %Notifications.Notification{id: ^id}}

      refute_receive {:notification, %Notifications.Notification{id: ^id}}
    end

    test "broadcasts to all subscribers in the provided users list", %{server: server} do
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(1, server)
      Notifications.NotificationServer.subscribe(2, server)

      id = 1

      Notifications.NotificationServer.broadcast_notification(
        %Notifications.Notification{
          id: id,
          created_at: nil,
          state: nil,
          content: nil
        },
        [0, 1],
        server
      )

      assert_receive {:notification, %Notifications.Notification{id: ^id}}
      assert_receive {:notification, %Notifications.Notification{id: ^id}}

      refute_receive {:notification, %Notifications.Notification{id: ^id}}
    end

    test "logs broadcast_to_cluster call", %{server: server} do
      Notifications.NotificationServer.subscribe(0, server)

      id = 1

      set_log_level(:info)

      log =
        capture_log([level: :info], fn ->
          Notifications.NotificationServer.broadcast_notification(
            %Notifications.Notification{
              id: id,
              created_at: nil,
              state: nil,
              content: nil
            },
            [0, 1],
            server
          )

          assert_receive {:notification, %Notifications.Notification{id: ^id}}
        end)

      assert log =~ "mfa=Notifications.NotificationServer.broadcast_to_cluster/3"
      assert log =~ "notification_id=#{id}"
      assert log =~ "nodes=[:nonode@nohost]"
    end

    test "logs broadcast_to_subscribers call", %{server: server} do
      # Subscribe with the same user id twice to test duplicate subscriptions in
      # the log output, where `user_id_count` != `messages_sent`.
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(1, server)
      Notifications.NotificationServer.subscribe(2, server)

      log_specific_users_id = 1

      set_log_level(:info)

      log_specific_users =
        capture_log([level: :info], fn ->
          Notifications.NotificationServer.broadcast_notification(
            %Notifications.Notification{
              id: log_specific_users_id,
              created_at: nil,
              state: nil,
              content: nil
            },
            [0, 1],
            server
          )

          # Absorb messages for the 3 matching subscriptions
          for _ <- 1..3 do
            assert_receive {:notification,
                            %Notifications.Notification{id: ^log_specific_users_id}}
          end

          :sys.get_state(server)
        end)

      log_all_users_id = 2

      log_all_users =
        capture_log([level: :info], fn ->
          Notifications.NotificationServer.broadcast_notification(
            %Notifications.Notification{
              id: log_all_users_id,
              created_at: nil,
              state: nil,
              content: nil
            },
            :all,
            server
          )

          # Absorb messages for all 4 subscriptions
          for _ <- 1..4 do
            assert_receive {:notification, %Notifications.Notification{id: ^log_all_users_id}}
          end

          :sys.get_state(server)
        end)

      assert log_specific_users =~
               "mfa=Notifications.NotificationServer.broadcast_to_subscribers/3"

      assert log_specific_users =~
               "notification_id=#{log_specific_users_id} messages_sent=3 total_subscribers=4 user_id_count=2"

      assert log_all_users =~ "mfa=Notifications.NotificationServer.broadcast_to_subscribers/3"

      assert log_all_users =~
               "notification_id=#{log_all_users_id} messages_sent=4 total_subscribers=4 user_match_pattern=all"
    end
  end

  describe "new_block_waivers/2" do
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

      user = User.upsert("fake_uid", "fakeemail@test.com")
      RouteTab.update_all_for_user!(user.id, [route_tab1])
      {:ok, %{user: user}}
    end

    test "broadcasts, saves, and logs nothing if no new block waivers are received", %{user: user} do
      {:ok, _server} = setup_server(user.id)

      set_log_level(:info)

      log =
        capture_log([level: :info], fn ->
          NotificationServer.handle_cast({:new_block_waivers, %{}}, nil)
        end)

      assert log == ""

      assert_n_notifications_in_db(0)
    end

    test "broadcasts, saves to the DB, and logs new notifications for waivers with recognized reason for vehicles on selected routes",
         %{user: user} do
      vehicle = @vehicle

      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [vehicle]
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server,
          operator_name: vehicle.operator_last_name,
          operator_id: vehicle.operator_id,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "broadcasts, saves to the DB, and logs new notifications for waivers with recognized reason for ghosts on selected routes",
         %{user: user} do
      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [@ghost]
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "broadcasts, saves to the DB, and logs new notifications for waivers with recognized reason when no vehicle or ghost is associated on selected routes",
         %{user: user} do
      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        []
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server)
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "doesn't send notifications to a user not looking at the route in question", %{
      user: user
    } do
      route_tab1 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["1", "83", "77"]
        })

      RouteTab.update_all_for_user!(user.id, [route_tab1])

      set_log_level(:info)

      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [@vehicle]
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        log =
          capture_log([level: :info], fn ->
            NotificationServer.new_block_waivers(
              waiver_map(cause_id, cause_description),
              server
            )

            refute_receive(_, 500)
          end)

        assert_block_waiver_notification_logged(log, cause_atom, @midnight + 100)
      end
    end

    test "doesn't log or save a duplicate notification, but does broadcast", %{user: user} do
      vehicle = @vehicle

      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [vehicle]
      end)

      {:ok, server} = setup_server(user.id)

      set_log_level(:info)

      NotificationServer.new_block_waivers(
        waiver_map(1, "J - Other"),
        server
      )

      Process.sleep(100)
      assert_n_notifications_in_db(1)
      existing_record = Skate.Repo.one(from(DbNotification))

      assert_block_waiver_notification(:other, "Other", 1, server,
        operator_name: vehicle.operator_last_name,
        operator_id: vehicle.operator_id,
        route_id_at_creation: "SL9001",
        log_expected: false,
        notification_id: existing_record.id
      )

      # Throw away message from first go-round
      receive do
        _ -> nil
      end

      log =
        capture_log([level: :info], fn ->
          NotificationServer.new_block_waivers(
            waiver_map(1, "J - Other"),
            server
          )

          assert_block_waiver_notification(:other, "Other", 1, server,
            operator_name: vehicle.operator_last_name,
            operator_id: vehicle.operator_id,
            route_id_at_creation: "SL9001",
            log_expected: false,
            notification_id: existing_record.id
          )
        end)

      assert_n_notifications_in_db(1)
      refute log =~ "new_notification"
    end
  end

  describe "Notifications.Notification broadcasts notifications when notification is created" do
    setup do
      registry_name = :new_notifications_registry
      start_supervised({Registry, keys: :duplicate, name: registry_name})
      reassign_env(:notifications, :registry, registry_name)

      {:ok, _server} = NotificationServer.start_link()

      :ok
    end

    test "create_detour_expiration_notification/3" do
      users = insert_list(3, :user)

      for %{id: user_id} <- users do
        Notifications.NotificationServer.subscribe(user_id)
      end

      detour = insert(:detour)

      {:ok, %{notification: %{id: id}}} =
        Notification.create_detour_expiration_notification(
          detour,
          %{
            expires_in: Duration.new!(minute: 30),
            estimated_duration: "1 hour"
          }
        )

      for _ <- users do
        assert_receive {:notification, %Notifications.Notification{id: ^id}}
      end
    end
  end
end
