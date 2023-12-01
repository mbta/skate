defmodule SkateWeb.EnsureAdminGroup do
  @moduledoc false

  import Plug.Conn

  def init(options), do: options

  def call(conn, _opts) do
    claims = Guardian.Plug.current_claims(conn)

    if SkateWeb.AuthManager.claims_access_level(claims) == :admin do
      conn
    else
      conn
      |> Phoenix.Controller.redirect(to: SkateWeb.Router.Helpers.unauthorized_path(conn, :index))
      |> halt()
    end
  end
end
