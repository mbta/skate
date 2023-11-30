defmodule Notifications.NotificationServerTest do
  use Skate.DataCase
  import Skate.Factory

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Notifications.Notification
  alias Notifications.NotificationServer
  alias Realtime.BlockWaiver
  alias Realtime.Ghost
  alias Realtime.Vehicle
  alias Skate.Settings.RouteTab
  alias Skate.Settings.Db.User, as: DbUser
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

  @chelsea_bridge_route_ids [
    # 743 is the SL3
    "112",
    "743"
  ]

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
        waiver_map(cause_id, cause_description)
        |> NotificationServer.new_block_waivers(server)

        operator_name = Keyword.get(opts, :operator_name)
        operator_id = Keyword.get(opts, :operator_id)
        route_id_at_creation = Keyword.get(opts, :route_id_at_creation)
        notification_id = Keyword.get(opts, :notification_id)

        if notification_id do
          assert_receive(
            {:notification,
             %Notifications.Notification{
               id: ^notification_id,
               created_at: _,
               reason: ^cause_atom,
               route_ids: ["39", "2"],
               run_ids: ["run1", "run2"],
               trip_ids: ["trip1", "trip2"],
               operator_name: ^operator_name,
               operator_id: ^operator_id,
               route_id_at_creation: ^route_id_at_creation,
               start_time: ^start_time
             }},
            5000
          )
        else
          assert_receive(
            {:notification,
             %Notifications.Notification{
               created_at: _,
               reason: ^cause_atom,
               route_ids: ["39", "2"],
               run_ids: ["run1", "run2"],
               trip_ids: ["trip1", "trip2"],
               operator_name: ^operator_name,
               operator_id: ^operator_id,
               route_id_at_creation: ^route_id_at_creation,
               start_time: ^start_time
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

    {:ok, server} = NotificationServer.start_link(name: :new_notifications)

    if user_id do
      NotificationServer.subscribe(user_id, server)
    end

    {:ok, server}
  end

  @spec create_n_users(non_neg_integer()) :: [DbUser.t()]
  defp create_n_users(n) do
    Enum.map(Range.new(0, n - 1), fn i ->
      username = "fake_uid#{i}"
      User.upsert(username, "#{username}@test.com")
    end)
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
            waiver_map(cause_id, cause_description)
            |> NotificationServer.new_block_waivers(server)

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

  describe "bridge_movement/2" do
    test "broadcasts, saves to the DB, and logs new notifications for users looking at routes affected by the Chelsea drawbridge when bridge is lowered" do
      {:ok, server} = setup_server()

      set_log_level(:info)

      for i <- Range.new(0, length(@chelsea_bridge_route_ids) - 1) do
        uid = "fake_uid#{i}"
        route_id = Enum.at(@chelsea_bridge_route_ids, i)

        route_tab1 =
          build(:route_tab, %{
            preset_name: "some routes",
            selected_route_ids: ["#{route_id}"]
          })

        %{id: user_id} = User.upsert(uid, "#{uid}@test.com")
        RouteTab.update_all_for_user!(user_id, [route_tab1])
      end

      start_time = DateTime.utc_now() |> DateTime.to_unix()

      log =
        capture_log([level: :info], fn ->
          NotificationServer.bridge_movement({:lowered, nil}, server)
          Process.sleep(1000)
        end)

      db_notification_users = Skate.Repo.all(DbNotificationUser)

      assert(length(db_notification_users) == length(@chelsea_bridge_route_ids))

      expected_route_ids_value =
        Enum.map_join(@chelsea_bridge_route_ids, ", ", &("\"" <> &1 <> "\""))

      assert String.contains?(log, "reason: :chelsea_st_bridge_lowered")
      assert String.contains?(log, "route_ids: [#{expected_route_ids_value}]")
      assert String.contains?(log, "start_time: #{start_time}")
      assert String.contains?(log, "run_ids: []")
      assert String.contains?(log, "trip_ids: []")
    end

    test "broadcasts, saves to the DB, and logs new notifications for users looking at routes affected by the Chelsea drawbridge when bridge is raised" do
      {:ok, server} = setup_server()

      set_log_level(:info)

      [user_0 | _others] = users = create_n_users(length(@chelsea_bridge_route_ids))

      for {user, i} <- Enum.with_index(users) do
        route_id = Enum.at(@chelsea_bridge_route_ids, i)

        route_tab1 =
          build(:route_tab, %{
            preset_name: "some routes",
            selected_route_ids: ["#{route_id}"]
          })

        RouteTab.update_all_for_user!(user.id, [route_tab1])
      end

      NotificationServer.subscribe(user_0.id, server)

      start_time = DateTime.utc_now() |> DateTime.to_unix()

      log =
        capture_log([level: :info], fn ->
          NotificationServer.bridge_movement({:raised, start_time}, server)
          Process.sleep(1000)
        end)

      assert_receive(
        {:notification,
         %Notification{
           reason: :chelsea_st_bridge_raised,
           created_at: start_time,
           route_ids: @chelsea_bridge_route_ids
         }}
      )

      db_notification_users = Skate.Repo.all(DbNotificationUser)

      assert(length(db_notification_users) == length(@chelsea_bridge_route_ids))

      expected_route_ids_value =
        Enum.map_join(@chelsea_bridge_route_ids, ", ", &("\"" <> &1 <> "\""))

      assert String.contains?(log, "reason: :chelsea_st_bridge_raised")
      assert String.contains?(log, "route_ids: [#{expected_route_ids_value}]")
      assert String.contains?(log, "start_time: #{start_time}")
      assert String.contains?(log, "run_ids: []")
      assert String.contains?(log, "trip_ids: []")
    end

    test "doesn't send notifications to a user not looking at the Chelsea bridge routes" do
      {:ok, server} = setup_server()

      route_tab1 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["1", "83", "77"]
        })

      %{id: user_id} = User.upsert("fake_uid", "fake_uid@test.com")
      RouteTab.update_all_for_user!(user_id, [route_tab1])

      set_log_level(:info)

      start_time = DateTime.utc_now() |> DateTime.to_unix()

      log =
        capture_log([level: :info], fn ->
          NotificationServer.bridge_movement({:raised, start_time}, server)
          Process.sleep(1000)
        end)

      refute_receive(_)

      db_notification_users = Skate.Repo.all(DbNotificationUser)

      assert Enum.empty?(db_notification_users)

      expected_route_ids_value =
        Enum.map_join(@chelsea_bridge_route_ids, ", ", &("\"" <> &1 <> "\""))

      assert String.contains?(log, "reason: :chelsea_st_bridge_raised")
      assert String.contains?(log, "route_ids: [#{expected_route_ids_value}]")
      assert String.contains?(log, "start_time: #{start_time}")
      assert String.contains?(log, "run_ids: []")
      assert String.contains?(log, "trip_ids: []")
    end

    test "doesn't log or save a notification within a blackout period after one was created, but does broadcast" do
      {:ok, server} = setup_server()

      set_log_level(:info)

      [user_0 | _others] = users = create_n_users(length(@chelsea_bridge_route_ids))

      for {user, i} <- Enum.with_index(users) do
        route_id = Enum.at(@chelsea_bridge_route_ids, i)

        route_tab1 =
          build(:route_tab, %{
            preset_name: "some routes",
            selected_route_ids: ["#{route_id}"]
          })

        RouteTab.update_all_for_user!(user.id, [route_tab1])
      end

      NotificationServer.subscribe(user_0.id, server)
      NotificationServer.bridge_movement({:lowered, nil}, server)

      assert_receive(
        {:notification,
         %Notification{reason: :chelsea_st_bridge_lowered, route_ids: @chelsea_bridge_route_ids}}
      )

      log =
        capture_log([level: :info], fn ->
          nil
          NotificationServer.bridge_movement({:lowered, nil}, server)
        end)

      assert_receive(
        {:notification,
         %Notification{reason: :chelsea_st_bridge_lowered, route_ids: @chelsea_bridge_route_ids}}
      )

      db_notification_users = Skate.Repo.all(DbNotificationUser)

      assert(length(db_notification_users) == length(@chelsea_bridge_route_ids))

      refute String.contains?(log, "new_notification")
    end
  end
end
