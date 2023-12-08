defmodule SkateWeb.EnsureAdminGroup do
  @moduledoc false

  use SkateWeb, :plug

  def init(options), do: options

  def call(conn, _opts) do
    claims = Guardian.Plug.current_claims(conn)

    if SkateWeb.AuthManager.claims_access_level(claims) == :admin do
      conn
    else
      conn
      |> Phoenix.Controller.redirect(to: ~p"/unauthorized")
      |> halt()
    end
  end
end
