defmodule SkateWeb.PageController do
  require Logger
  use SkateWeb, :controller
  alias Skate.Settings.RouteSettings
  alias Skate.Settings.UserSettings
  alias SkateWeb.AuthManager

  plug(:laboratory_features)

  def index(conn, _params) do
    username = AuthManager.Plug.current_resource(conn)
    _ = Logger.info("uid=#{username}")

    user_settings = UserSettings.get_or_create(username)
    route_settings = RouteSettings.get_or_create(username)

    conn
    |> assign(:username, username)
    |> assign(:csrf_token, Plug.CSRFProtection.get_csrf_token())
    |> assign(:user_settings, user_settings)
    |> assign(:route_settings, route_settings)
    |> render("index.html")
  end

  defp laboratory_features(conn, _) do
    laboratory_features =
      :laboratory
      |> Application.get_env(:features)
      |> Map.new(fn {key, _, _} -> {key, Laboratory.enabled?(conn, key)} end)

    assign(conn, :laboratory_features, laboratory_features)
  end
end
