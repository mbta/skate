defmodule SkateWeb.PageController do
  require Logger
  use SkateWeb, :controller
  alias Skate.Settings.User
  alias Skate.Settings.UserSettings
  alias Skate.Settings.RouteTab
  alias SkateWeb.AuthManager

  plug(:laboratory_features)

  def index(conn, _params) do
    %{id: user_id} = AuthManager.Plug.current_resource(conn)
    %{username: username} = user = User.get_by_id!(user_id) |> Skate.Repo.preload(:test_groups)

    _ = Logger.info("uid=#{username}")

    user_settings = UserSettings.get_or_create(user_id)
    route_tabs = RouteTab.get_all_for_user(user_id)

    dispatcher_flag =
      conn |> Guardian.Plug.current_claims() |> AuthManager.claims_grant_dispatcher_access?()

    map_limits = Application.get_env(:skate, :map_limits)

    conn
    |> assign(:username, username)
    |> assign(:user_uuid, user.uuid)
    |> assign(:csrf_token, Plug.CSRFProtection.get_csrf_token())
    |> assign(:user_settings, user_settings)
    |> assign(:route_tabs, route_tabs)
    |> assign(:dispatcher_flag, dispatcher_flag)
    |> assign(:google_tag_manager_id, Application.get_env(:skate, :google_tag_manager_id))
    |> assign(:tileset_url, Application.get_env(:skate, :tileset_url))
    |> assign(:tileset_urls, %{
      base: Application.get_env(:skate, :base_tileset_url),
      satellite: Application.get_env(:skate, :satellite_tileset_url)
    })
    |> assign(:user_test_groups, user.test_groups |> Enum.map(& &1.name))
    |> assign(:map_limits, map_limits)
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
