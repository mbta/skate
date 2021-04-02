defmodule SkateWeb.AuthController do
  use SkateWeb, :controller
  plug(Ueberauth)

  alias SkateWeb.AuthManager
  alias SkateWeb.Router.Helpers

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    username = auth.uid
    credentials = auth.credentials
    expiration = credentials.expires_at

    current_time = System.system_time(:second)

    if Map.has_key?(credentials, :refresh_token) && credentials.refresh_token do
      refresh_token_store = Application.get_env(:skate, :refresh_token_store)
      refresh_token_store.put_refresh_token(username, credentials.refresh_token)
    end

    conn
    |> Guardian.Plug.sign_in(
      AuthManager,
      username,
      %{groups: credentials.other[:groups]},
      ttl: {expiration - current_time, :seconds}
    )
    |> Plug.Conn.put_session(:username, username)
    |> redirect(to: Helpers.page_path(conn, :index))
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
    refresh_token_store = Application.get_env(:skate, :refresh_token_store)

    conn
    |> Plug.Conn.get_session(:username)
    |> refresh_token_store.clear_refresh_token()

    # Users are sometimes seeing unexpected Ueberauth failures of unknown provenance.
    # Instead of sending a 403 unauthenticated response, we are signing them out and
    # sending them to the home page to start the auth path over again.
    # We should be on the lookout for users getting trapped in a loop because of this.
    # If we observe that happening we should rethink this remedy. -- MSS 2019-07-03
    conn
    |> Guardian.Plug.sign_out(AuthManager, [])
    |> redirect(to: Helpers.page_path(conn, :index))
  end
end
