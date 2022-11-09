defmodule SkateWeb.AuthController do
  use SkateWeb, :controller
  plug(Ueberauth)

  alias Skate.Settings.User
  alias SkateWeb.AuthManager
  alias SkateWeb.Router.Helpers

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    username = auth.uid
    email = auth.info.email
    credentials = auth.credentials
    expiration = credentials.expires_at

    current_time = System.system_time(:second)

    %{id: user_id} = User.upsert(username, email)

    conn
    |> Guardian.Plug.sign_in(
      AuthManager,
      %{id: user_id},
      %{groups: credentials.other[:groups]},
      ttl: {expiration - current_time, :seconds}
    )
    |> redirect(to: Helpers.page_path(conn, :index))
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
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
