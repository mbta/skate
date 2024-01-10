defmodule SkateWeb.AuthController do
  use SkateWeb, :controller
  plug(Ueberauth)

  import Plug.Conn
  alias Skate.Settings.User
  alias SkateWeb.AuthManager

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    username = auth.uid
    email = auth.info.email
    credentials = auth.credentials
    expiration = credentials.expires_at

    keycloak_client_id =
      get_in(Application.get_env(:ueberauth_oidcc, :providers), [:keycloak, :client_id])

    groups =
      get_in(auth.extra.raw_info.userinfo, ["resource_access", keycloak_client_id, "roles"]) || []

    current_time = System.system_time(:second)

    %{id: user_id} = User.upsert(username, email)

    conn
    |> delete_session(:auth_retries)
    |> Guardian.Plug.sign_in(
      AuthManager,
      %{id: user_id},
      %{groups: groups},
      ttl: {expiration - current_time, :seconds}
    )
    |> redirect(to: ~p"/")
  end

  def callback(%{assigns: %{ueberauth_failure: _fails}} = conn, _params) do
    # Users are sometimes seeing unexpected Ueberauth failures of unknown provenance.
    # Instead of sending a 403 unauthenticated response immediately, we are signing them out and
    # sending them to the home page to start the auth path over again. -- MSS 2019-07-03
    # We are maintaining the retry logic but limiting it to only a set number of retries using
    # logic in SkateWeb.AuthManager.ErrorHandler. -- LEM 2023-04-27
    conn
    |> Guardian.Plug.sign_out(AuthManager, [])
    |> redirect(to: ~p"/")
  end
end
