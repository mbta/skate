defmodule SkateWeb.NotificationReadStatesControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias Notifications.Notification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias SkateWeb.AuthManager
  alias Skate.Settings.RouteSettings
  alias Skate.Settings.User

  import Ecto.Query

  @username "FAKE_UID"

  defp login(conn) do
    {:ok, token, _} = AuthManager.encode_and_sign(@username)
    put_req_header(conn, "authorization", "bearer: " <> token)
  end

  describe "PUT /api/notification_read_states" do
    test "sets read state for a batch of notifications for the user", %{conn: conn} do
      user = User.get_or_create(@username)
      RouteSettings.get_or_create(@username)
      RouteSettings.set(@username, selected_route_ids: ["1", "2"])

      User.get_or_create("otherguy")
      RouteSettings.get_or_create("otherguy")
      RouteSettings.set("otherguy", selected_route_ids: ["1", "2"])

      user_notification1 =
        Notification.get_or_create_from_block_waiver(%{
          block_id: "bl1",
          service_id: "ser1",
          created_at: 0,
          reason: :manpower,
          route_ids: ["1"],
          run_ids: [],
          trip_ids: [],
          start_time: 0,
          end_time: 0
        })

      user_notification2 =
        Notification.get_or_create_from_block_waiver(%{
          block_id: "bl1",
          service_id: "ser1",
          created_at: 0,
          reason: :other,
          route_ids: ["2"],
          run_ids: [],
          trip_ids: [],
          start_time: 0,
          end_time: 0
        })

      unread_state = :unread
      read_state = :read

      assert Skate.Repo.one(
               from(nu in DbNotificationUser,
                 select: count(nu),
                 where: nu.state == ^unread_state
               )
             ) == 4

      conn =
        conn
        |> login
        |> put("/api/notification_read_state", %{
          "new_state" => "read",
          "notification_ids" => "#{user_notification1.id}"
        })

      response(conn, 200)

      assert Skate.Repo.one(
               from(nu in DbNotificationUser,
                 select: count(nu),
                 where: nu.state == ^read_state
               )
             ) == 1

      assert Skate.Repo.one(
               from(nu in DbNotificationUser,
                 select: {nu.notification_id, nu.user_id},
                 where: nu.state == ^read_state
               )
             ) == {user_notification1.id, user.id}

      conn =
        conn
        |> put("/api/notification_read_state", %{
          "new_state" => "read",
          "notification_ids" => "#{user_notification2.id}"
        })

      response(conn, 200)

      assert Skate.Repo.one(
               from(nu in DbNotificationUser,
                 select: count(nu),
                 where: nu.state == ^read_state
               )
             ) == 2

      read_notification_user_ids =
        Skate.Repo.all(
          from(nu in DbNotificationUser,
            select: {nu.notification_id, nu.user_id},
            where: nu.state == ^read_state
          )
        )
        |> Enum.sort()

      assert read_notification_user_ids ==
               [
                 {user_notification1.id, user.id},
                 {user_notification2.id, user.id}
               ]
               |> Enum.sort()

      conn =
        conn
        |> put("/api/notification_read_state", %{
          "new_state" => "unread",
          "notification_ids" => "#{user_notification1.id},#{user_notification2.id}"
        })

      response(conn, 200)

      assert Skate.Repo.one(
               from(nu in DbNotificationUser,
                 select: count(nu),
                 where: nu.state == ^unread_state
               )
             ) == 4
    end
  end
end
