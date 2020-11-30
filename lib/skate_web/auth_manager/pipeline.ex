defmodule SkateWeb.AuthManager.Pipeline do
  use Guardian.Plug.Pipeline,
    otp_app: :skate,
    error_handler: SkateWeb.AuthManager.ErrorHandler,
    module: SkateWeb.AuthManager

  plug(Guardian.Plug.VerifySession, claims: %{"typ" => "access"})
  plug(Guardian.Plug.VerifyHeader, claims: %{"typ" => "access"})
  plug(Guardian.Plug.LoadResource, allow_blank: true)
  plug :set_username_for_sentry

  def set_username_for_sentry(conn, _opts) do
    username = get_session(conn, :username)

    if username do
      Sentry.Context.set_user_context(%{username: username})
    end

    conn
  end
end
