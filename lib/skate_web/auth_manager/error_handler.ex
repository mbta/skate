defmodule SkateWeb.AuthManager.ErrorHandler do
  @moduledoc false

  use SkateWeb, :plug

  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {_type, _reason}, _opts) do
    keycloak_enabled? =
      "keycloak-sso-2" in Enum.map(Skate.Settings.TestGroup.get_override_enabled(), & &1.name)

    if keycloak_enabled? do
      Phoenix.Controller.redirect(conn, to: ~p"/auth/keycloak")
    else
      auth_retries = get_session(conn, :auth_retries) || 3

      if auth_retries > 0 do
        conn
        |> put_session(:auth_retries, auth_retries - 1)
        |> Phoenix.Controller.redirect(to: ~p"/auth/cognito")
      else
        conn
        |> delete_session(:auth_retries)
        |> send_resp(:unauthorized, "unauthorized")
      end
    end
  end
end
