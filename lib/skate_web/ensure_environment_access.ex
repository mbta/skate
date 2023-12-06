defmodule SkateWeb.EnsureEnvironmentAccess do
  @moduledoc false

  use SkateWeb, :plug

  def init(options), do: options

  def call(conn, _opts) do
    if Application.get_env(:skate, :restrict_environment_access?, false) &&
         !user_has_access_to_restricted_env(conn) do
      conn
      |> Phoenix.Controller.redirect(to: ~p"/restricted")
      |> halt()
    else
      conn
    end
  end

  defp user_has_access_to_restricted_env(conn) do
    claims = Guardian.Plug.current_claims(conn)

    SkateWeb.AuthManager.claims_access_level(claims) == :admin
  end
end
