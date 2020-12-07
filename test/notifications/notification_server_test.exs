defmodule Notifications.NotificationServerTest do
  use Skate.DataCase

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.NotificationServer
  alias Realtime.BlockWaiver
  alias Realtime.Ghost
  alias Realtime.Vehicle
  alias Schedule.Block
  alias Schedule.Trip
  alias Skate.Repo
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.RouteSettings

  import Ecto.Query
  import ExUnit.CaptureLog, only: [capture_log: 1]
  import Test.Support.Helpers, only: [reassign_env: 3]

  require Logger

  @block %Block{
    id: "block1",
    service_id: "service1",
    start_time: 1,
    end_time: 1000,
    trips: [
      %Trip{
        id: "trip1",
        block_id: "block1",
        run_id: "run1",
        route_id: "39",
        start_time: 50,
        end_time: 200
      },
      %Trip{
        id: "trip2",
        block_id: "block1",
        run_id: "run2",
        route_id: "2",
        start_time: 400,
        end_time: 800
      },
      %Trip{
        id: "not_covered_by_waiver",
        block_id: "block1",
        run_id: "run3",
        route_id: "3",
        start_time: 501,
        end_time: 800
      }
    ]
  }

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

  @vehicle %Vehicle{
    id: "y0507",
    label: "0507",
    timestamp: 123,
    latitude: 0.0,
    longitude: 0.0,
    direction_id: "234",
    route_id: "SL9001",
    trip_id: "456",
    bearing: nil,
    block_id: nil,
    operator_id: "56785678",
    operator_name: "CHARLIE",
    operator_logon_time: nil,
    run_id: "123-4567",
    headway_secs: 600,
    headway_spacing: :ok,
    is_shuttle: false,
    is_overload: false,
    is_off_course: false,
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

  def assert_notification(cause_atom, cause_description, cause_id, server, opts \\ []) do
    start_time = @midnight + 100

    log =
      capture_log(fn ->
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
    if log_expected, do: assert_notification_logged(log, cause_atom, start_time)
  end

  def assert_notification_logged(log, cause_atom, start_time) do
    assert String.contains?(log, "reason: :#{cause_atom}")
    assert String.contains?(log, "route_ids: [\"39\", \"2\"]")
    assert String.contains?(log, "run_ids: [\"run1\", \"run2\"]")
    assert String.contains?(log, "trip_ids: [\"trip1\", \"trip2\"]")
    assert String.contains?(log, "start_time: #{start_time}")
  end

  def setup_server(username \\ "fake_uid") do
    registry_name = :new_notifications_registry
    start_supervised({Registry, keys: :duplicate, name: registry_name})
    reassign_env(:notifications, :registry, registry_name)

    {:ok, server} = NotificationServer.start_link(name: :new_notifications)

    NotificationServer.subscribe(username, server)
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
          end_time: @midnight + 86400,
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

      RouteSettings.get_or_create("fake_uid")
      RouteSettings.set("fake_uid", [{:selected_route_ids, ["39"]}])
    end

    test "broadcasts, saves, and logs nothing if no new block waivers are received" do
      {:ok, _server} = setup_server()

      log =
        capture_log(fn ->
          NotificationServer.handle_cast({:new_block_waivers, %{}}, nil)
        end)

      assert log == ""

      assert_n_notifications_in_db(0)
    end

    test "broadcasts, saves to the DB, and logs new notifications for waivers with recognized reason for vehicles on selected routes" do
      reassign_env(:realtime, :peek_at_vehicles_fn, fn _ ->
        [@vehicle]
      end)

      {:ok, server} = setup_server()

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_notification(cause_atom, cause_description, cause_id, server,
          operator_name: "CHARLIE",
          operator_id: "56785678",
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "broadcasts, saves to the DB, and logs new notifications for waivers with recognized reason for ghosts on selected routes" do
      reassign_env(:realtime, :peek_at_vehicles_fn, fn _ ->
        [@ghost]
      end)

      {:ok, server} = setup_server()

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_notification(cause_atom, cause_description, cause_id, server,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "broadcasts, saves to the DB, and logs new notifications for waivers with recognized reason when no vehicle or ghost is associated on selected routes" do
      reassign_env(:realtime, :peek_at_vehicles_fn, fn _ ->
        []
      end)

      {:ok, server} = setup_server()

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_notification(cause_atom, cause_description, cause_id, server)
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "doesn't send notifications to a user not looking at the route in question" do
      Repo.delete_all(from(DbUser))
      RouteSettings.get_or_create("fake_uid")
      RouteSettings.set("fake_uid", [{:selected_route_ids, ["1,83,77"]}])

      reassign_env(:realtime, :peek_at_vehicles_fn, fn _ ->
        [@vehicle]
      end)

      {:ok, server} = setup_server()

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        log =
          capture_log(fn ->
            waiver_map(cause_id, cause_description)
            |> NotificationServer.new_block_waivers(server)

            refute_receive(_, 500)
          end)

        assert_notification_logged(log, cause_atom, @midnight + 100)
      end
    end

    test "doesn't log or save a duplicate notification, but does broadcast" do
      reassign_env(:realtime, :peek_at_vehicles_fn, fn _ ->
        [@vehicle]
      end)

      {:ok, server} = setup_server()

      NotificationServer.new_block_waivers(
        waiver_map(1, "J - Other"),
        server
      )

      Process.sleep(100)
      assert_n_notifications_in_db(1)
      existing_record = Skate.Repo.one(from(DbNotification))

      assert_notification(:other, "Other", 1, server,
        operator_name: "CHARLIE",
        operator_id: "56785678",
        route_id_at_creation: "SL9001",
        log_expected: false,
        notification_id: existing_record.id
      )

      # Throw away message from first go-round
      receive do
        _ -> nil
      end

      log =
        capture_log(fn ->
          NotificationServer.new_block_waivers(
            waiver_map(1, "J - Other"),
            server
          )

          assert_notification(:other, "Other", 1, server,
            operator_name: "CHARLIE",
            operator_id: "56785678",
            route_id_at_creation: "SL9001",
            log_expected: false,
            notification_id: existing_record.id
          )
        end)

      assert_n_notifications_in_db(1)
      assert String.contains?(log, "new_notification") == false
    end
  end
end
