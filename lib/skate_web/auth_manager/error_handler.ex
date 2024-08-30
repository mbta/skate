defmodule SkateWeb.AuthManager.ErrorHandler do
  @moduledoc false

  use SkateWeb, :plug

  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {_type, _reason}, _opts) do
    Phoenix.Controller.redirect(conn, to: ~p"/auth/keycloak")
  end
end
