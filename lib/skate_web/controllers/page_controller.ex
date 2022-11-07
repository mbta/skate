defmodule SkateWeb.PageController do
  require Logger
  use SkateWeb, :controller
  alias Skate.Settings.User
  alias Skate.Settings.UserSettings
  alias Skate.Settings.RouteTab
  alias SkateWeb.AuthManager

  plug(:laboratory_features)

  def index(conn, _params) do
    username =
      conn
      |> AuthManager.Plug.current_resource()
      |> AuthManager.username_from_resource()

    _ = Logger.info("uid=#{username}")

    user = username |> User.get() |> Skate.Repo.preload(:test_groups)
    user_settings = UserSettings.get_or_create(username)
    route_tabs = RouteTab.get_all_for_user(username)

    dispatcher_flag =
      conn |> Guardian.Plug.current_claims() |> AuthManager.claims_grant_dispatcher_access?()

    conn
    |> assign(:username, username)
    |> assign(:user_uuid, user.uuid)
    |> assign(:csrf_token, Plug.CSRFProtection.get_csrf_token())
    |> assign(:user_settings, user_settings)
    |> assign(:route_tabs, route_tabs)
    |> assign(:dispatcher_flag, dispatcher_flag)
    |> assign(:clarity_tag, Application.get_env(:skate, :clarity_tag))
    |> assign(:google_tag_manager_id, Application.get_env(:skate, :google_tag_manager_id))
    |> assign(:tileset_url, Application.get_env(:skate, :tileset_url))
    |> assign(:user_test_groups, user.test_groups |> Enum.map(& &1.name))
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
