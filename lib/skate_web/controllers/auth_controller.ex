defmodule SkateWeb.AuthController do
  use SkateWeb, :controller
  plug(Ueberauth)

  import Plug.Conn
  alias Skate.Settings.User
  alias SkateWeb.AuthManager

  def callback(%{assigns: %{ueberauth_auth: %{provider: :keycloak} = auth}} = conn, _params) do
    username = auth.uid
    email = auth.info.email
    credentials = auth.credentials
    expiration = credentials.expires_at

    keycloak_client_id =
      get_in(Application.get_env(:ueberauth_oidcc, :providers), [:keycloak, :client_id])

    groups =
      get_in(auth.extra.raw_info.userinfo, ["resource_access", keycloak_client_id, "roles"]) || []

    if "skate-readonly" in groups do
      current_time = System.system_time(:second)

      %{id: user_id} = User.upsert(username, email)

      conn
      |> Guardian.Plug.sign_in(
        AuthManager,
        %{id: user_id},
        %{groups: groups, sign_out_url: sign_out_url(auth)},
        ttl: {expiration - current_time, :seconds}
      )
      |> redirect(to: ~p"/")
    else
      send_resp(conn, :forbidden, "forbidden")
    end
  end

  def callback(%{assigns: %{ueberauth_auth: %{provider: :cognito} = auth}} = conn, _params) do
    username = auth.uid
    email = auth.info.email
    credentials = auth.credentials
    expiration = credentials.expires_at

    current_time = System.system_time(:second)

    %{id: user_id} = User.upsert(username, email)

    conn
    |> delete_session(:auth_retries)
    |> Guardian.Plug.sign_in(
      AuthManager,
      %{id: user_id},
      %{groups: credentials.other[:groups]},
      ttl: {expiration - current_time, :seconds}
    )
    |> redirect(to: ~p"/")
  end

  def callback(%{assigns: %{ueberauth_failure: %{provider: :cognito}}} = conn, _params) do
    # Users are sometimes seeing unexpected Ueberauth failures of unknown provenance.
    # Instead of sending a 403 unauthenticated response immediately, we are signing them out and
    # sending them to the home page to start the auth path over again. -- MSS 2019-07-03
    # We are maintaining the retry logic but limiting it to only a set number of retries using
    # logic in SkateWeb.AuthManager.ErrorHandler. -- LEM 2023-04-27
    conn
    |> Guardian.Plug.sign_out(AuthManager, [])
    |> redirect(to: ~p"/")
  end

  def callback(%{assigns: %{ueberauth_failure: %{provider: :keycloak}}} = conn, _params) do
    send_resp(conn, :unauthorized, "unauthenticated")
  end

  # https://github.com/mbta/arrow/blob/372c279e04866509f1e287e07844d61cc243850b/lib/arrow_web/controllers/auth_controller.ex#L57-L66
  defp sign_out_url(auth) do
    case initiate_logout_url(auth, %{
           post_logout_redirect_uri: "https://www.mbta.com/"
         }) do
      {:ok, url} ->
        url

      _ ->
        nil
    end
  end

  defp initiate_logout_url(auth, opts),
    do:
      Application.get_env(:skate, :logout_url_fn, &UeberauthOidcc.initiate_logout_url/2).(
        auth,
        opts
      )

  @spec logout(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def logout(conn, %{"provider" => "keycloak"}) do
    case Guardian.Plug.current_claims(conn) do
      %{"sign_out_url" => sign_out_url} when not is_nil(sign_out_url) ->
        conn
        |> session_cleanup()
        |> redirect(external: sign_out_url)

      # The router makes sure we can't call `/auth/:provider/callback`
      # unless we have a session.
      # So the potential `nil` from `current_claims` and the potential map with
      # `sign_out_url=nil` can be handled the same
      _ ->
        conn
        |> session_cleanup()
        |> redirect(to: "/")
    end
  end

  defp session_cleanup(conn) do
    conn
    |> SkateWeb.AuthManager.Plug.sign_out()
    |> configure_session(drop: true)
  end
end
