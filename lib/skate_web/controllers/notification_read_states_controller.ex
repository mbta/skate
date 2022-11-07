defmodule SkateWeb.NotificationReadStatesController do
  use SkateWeb, :controller

  alias Notifications.Notification
  alias SkateWeb.AuthManager

  def update(conn, %{"new_state" => new_read_state, "notification_ids" => notification_ids}) do
    username =
      conn
      |> AuthManager.Plug.current_resource()
      |> AuthManager.username_from_resource()

    new_read_state = String.to_existing_atom(new_read_state)
    notification_ids = String.split(notification_ids, ",")

    Notification.update_read_states(username, notification_ids, new_read_state)

    send_resp(conn, 200, "")
  end
end
