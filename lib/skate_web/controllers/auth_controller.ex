defmodule SkateWeb.AuthController do
  use SkateWeb, :controller
  plug(Ueberauth)

  alias SkateWeb.AuthManager
  alias SkateWeb.Router.Helpers

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    username = auth.uid
    expiration = auth.credentials.expires_at

    current_time = System.system_time(:second)

    conn
    |> Guardian.Plug.sign_in(
      AuthManager,
      username,
      %{},
      ttl: {expiration - current_time, :seconds}
    )
    |> redirect(to: Helpers.page_path(conn, :index))
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
    send_resp(conn, 403, "unauthenticated")
  end
end
