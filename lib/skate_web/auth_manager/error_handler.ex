defmodule SkateWeb.AuthManager.ErrorHandler do
  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {_type, _reason}, _opts) do
    refresh_token_store = Application.get_env(:skate, :refresh_token_store)

    refresh_token =
      conn
      |> Plug.Conn.get_session(:username)
      |> refresh_token_store.get_refresh_token()

    if refresh_token do
      Phoenix.Controller.redirect(conn,
        to:
          SkateWeb.Router.Helpers.auth_path(conn, :callback, "cognito", %{
            "refresh_token" => refresh_token
          })
      )
    else
      Phoenix.Controller.redirect(conn,
        to: SkateWeb.Router.Helpers.auth_path(conn, :request, "cognito")
      )
    end
  end
end
