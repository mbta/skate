defmodule SkateWeb.PushSpikeController do
  use SkateWeb, :controller

  def create(
        conn,
        %{"endpoint" => endpoint, "keys" => %{"auth" => auth_key, "p256dh" => p256dh_key}}
      ) do
    username = Plug.Conn.get_session(conn, :username)

    Skate.PushSpikeServer.subscribe(username, endpoint, auth_key, p256dh_key)
    json(conn, nil)
  end
end
