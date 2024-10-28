defmodule SkateWeb.AuthManager.Pipeline do
  @moduledoc false

  use Guardian.Plug.Pipeline,
    otp_app: :skate,
    error_handler: SkateWeb.AuthManager.ErrorHandler,
    module: SkateWeb.AuthManager

  plug(Guardian.Plug.VerifySession, claims: %{"typ" => "access"})
  plug(Guardian.Plug.VerifyHeader, claims: %{"typ" => "access"})
  plug(Guardian.Plug.EnsureAuthenticated, claims: %{"typ" => "access"})
  plug(Guardian.Plug.LoadResource, allow_blank: true)
end
