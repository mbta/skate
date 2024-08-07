defmodule SkateWeb.AuthController do
  use SkateWeb, :controller
  plug(Ueberauth)

  require Logger

  import Plug.Conn
  alias Skate.Settings.User
  alias SkateWeb.AuthManager
  alias SkateWeb.Plugs.CaptureAuthReturnPath

  def callback(%{assigns: %{ueberauth_auth: %{provider: :keycloak} = auth}} = conn, _params) do
    username = auth.uid
    email = auth.info.email

    post_auth_redirect = CaptureAuthReturnPath.get_post_auth_return_to_path(conn)

    keycloak_client_id =
      get_in(Application.get_env(:ueberauth_oidcc, :providers), [:keycloak, :client_id])

    groups =
      get_in(auth.extra.raw_info.userinfo, ["resource_access", keycloak_client_id, "roles"]) || []

    if "skate-readonly" in groups do
      %{id: user_id} = User.upsert(username, email)

      conn
      |> Guardian.Plug.sign_in(
        AuthManager,
        %{id: user_id},
        %{groups: groups},
        ttl: {1, :hour}
      )
      |> put_session(:sign_out_url, sign_out_url(auth))
      |> redirect(to: post_auth_redirect)
    else
      send_resp(conn, :forbidden, "forbidden")
    end
  end

  def callback(
        %{
          assigns: %{
            ueberauth_failure:
              %Ueberauth.Failure{
                provider: :keycloak,
                errors: [%Ueberauth.Failure.Error{message_key: "csrf_attack"}]
              } = auth_struct
          }
        } = conn,
        _params
      ) do
    Logger.error("keycloak callback csrf ueberauth_failure struct=#{Kernel.inspect(auth_struct)}")

    if get_session(conn, :keycloak_csrf_retry) == 1 do
      conn
      |> delete_session(:keycloak_csrf_retry)
      |> send_resp(:unauthorized, "unauthenticated")
    else
      conn
      |> put_session(:keycloak_csrf_retry, 1)
      |> Guardian.Plug.sign_out(AuthManager, [])
      |> redirect(to: ~p"/auth/keycloak")
    end
  end

  def callback(
        %{assigns: %{ueberauth_failure: %{provider: :keycloak} = auth_struct}} = conn,
        _params
      ) do
    Logger.error("keycloak callback ueberauth_failure struct=#{Kernel.inspect(auth_struct)}")

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
    sign_out_url = get_session(conn, :sign_out_url)

    if is_nil(sign_out_url) do
      # The router makes sure we can't call `/auth/:provider/callback`
      # unless we have a session.
      # So the potential `nil` from `current_claims` and the potential map with
      # `sign_out_url=nil` can be handled the same
      conn
      |> session_cleanup()
      |> redirect(to: "/")
    else
      conn
      |> session_cleanup()
      |> redirect(external: sign_out_url)
    end
  end

  defp session_cleanup(conn) do
    conn
    |> SkateWeb.AuthManager.Plug.sign_out()
    |> configure_session(drop: true)
  end
end
