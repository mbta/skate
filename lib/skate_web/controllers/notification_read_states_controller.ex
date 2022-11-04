defmodule SkateWeb.NotificationReadStatesController do
  use SkateWeb, :controller

  alias Notifications.Notification
  alias SkateWeb.AuthManager

  def update(conn, %{"new_state" => new_read_state, "notification_ids" => notification_ids}) do
    %{user_id: user_id} = AuthManager.Plug.current_resource(conn)

    new_read_state = String.to_existing_atom(new_read_state)
    notification_ids = String.split(notification_ids, ",")

    Notification.update_read_states(user_id, notification_ids, new_read_state)

    send_resp(conn, 200, "")
  end
end
