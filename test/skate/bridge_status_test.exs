defmodule Skate.BridgeStatusTest do
  use Skate.DataCase

  alias Skate.BridgeStatus

  doctest Skate.BridgeStatus

  describe "get_latest_bridge_status/0" do
  end

  describe "maybe_record_bridge_status/2" do
    test "creates bridge movement record" do
      assert {:ok, %Notifications.Db.BridgeMovement{id: id}} =
               BridgeStatus.maybe_record_bridge_status(%{status: :lowered}, [])

      assert %{status: :lowered} = Repo.get(Notifications.Db.BridgeMovement, id)
    end

    test "returns :error if another record exists in the cutoff period" do
      Test.Support.Helpers.config(
        :skate,
        BridgeStatus,
        blackout_period: Duration.new!(second: -30)
      )

      now = DateTime.utc_now()

      assert {:ok, _} =
               BridgeStatus.maybe_record_bridge_status(
                 %{
                   status: :lowered,
                   inserted_at: now
                 },
                 test_time: now
               )

      for seconds <- [0, 1, 10, 29] do
        assert {:error, {:bridge_movement_already_exists, _}} =
                 BridgeStatus.maybe_record_bridge_status(
                   %{
                     status: :lowered
                   },
                   test_time: DateTime.shift(now, second: seconds)
                 )
      end

      assert {:ok, _} =
               BridgeStatus.maybe_record_bridge_status(
                 %{
                   status: :lowered
                 },
                 test_time: DateTime.shift(now, second: 30)
               )
    end

    test "returns :ok if status changes within cutoff period" do
      Test.Support.Helpers.config(
        :skate,
        BridgeStatus,
        blackout_period: Duration.new!(second: -30)
      )

      now = start = DateTime.utc_now()

      assert {:ok, _} =
               BridgeStatus.maybe_record_bridge_status(
                 %{
                   status: :lowered,
                   inserted_at: now
                 },
                 test_time: now
               )

      now = DateTime.shift(start, second: 1)

      assert {:ok, _} =
               BridgeStatus.maybe_record_bridge_status(
                 %{
                   status: :raised,
                   lowering_time: DateTime.to_unix(now),
                   inserted_at: now
                 },
                 test_time: now
               )
    end

    test "creates notifications for users looking at routes affected by the chelsea drawbridge" do
      [%{id: user_id_1}, %{id: user_id_2}, _user_3] =
        for route_id <- ["1", "2", "3"] do
          Skate.Factory.insert(:user,
            route_tabs: [
              Map.from_struct(Skate.Factory.build(:route_tab, selected_route_ids: [route_id]))
            ]
          )
        end

      Test.Support.Helpers.config(
        :skate,
        BridgeStatus,
        bridge_route_ids: ["1", "2"]
      )

      {:ok, %{notification: %{id: notification_id}}} =
        BridgeStatus.maybe_record_bridge_status(%{
          status: :lowered
        })

      assert [%{id: ^user_id_1}, %{id: ^user_id_2}] =
               Skate.Repo.all(
                 from(
                   n in Notifications.Db.Notification,
                   where: [id: ^notification_id],
                   join: users in assoc(n, :users),
                   order_by: users.id,
                   select: users
                 )
               )

      {:ok, %{notification: %{id: notification_id}}} =
        BridgeStatus.maybe_record_bridge_status(%{
          status: :raised
        })

      assert [%{id: ^user_id_1}, %{id: ^user_id_2}] =
               Skate.Repo.all(
                 from(
                   n in Notifications.Db.Notification,
                   where: [id: ^notification_id],
                   join: users in assoc(n, :users),
                   order_by: users.id,
                   select: users
                 )
               )
    end
  end
end
