defmodule SkateWeb.Router do
  use SkateWeb, :router

  # We prefer to redirect at the load balancer level, but for security through
  # redundancy, we're keeping this plug just in case.
  # A note: this does not affect anything before the `Skate.Router` plug in `endpoint.ex`
  # e.g., static assets will not get redirected to HTTPS.
  pipeline :redirect_prod_http do
    if Application.compile_env(:skate, :redirect_http?) do
      plug(Plug.SSL, rewrite_on: [:x_forwarded_proto])
    end
  end

  pipeline :auth do
    plug(SkateWeb.AuthManager.Pipeline)
  end

  pipeline :ensure_auth do
    plug(Guardian.Plug.EnsureAuthenticated)
  end

  pipeline :ensure_environment_access do
    plug(SkateWeb.EnsureEnvironmentAccess)
  end

  pipeline :ensure_admin_group do
    plug(SkateWeb.EnsureAdminGroup)
  end

  pipeline :accepts_html do
    plug :accepts, ["html"]
  end

  pipeline :accepts_json do
    plug :accepts, ["json"]
  end

  pipeline :browser do
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :capture_auth_return_path do
    plug(SkateWeb.Plugs.CaptureAuthReturnPath)
  end

  scope "/", SkateWeb do
    pipe_through([
      :browser,
      :accepts_html
    ])

    get "/docs/agency-policies/aup", Redirect, external: :aup
    get "/user-guide", Redirect, external: :user_guide
    get "/training", Redirect, external: :training
  end

  scope "/auth", SkateWeb do
    pipe_through([:redirect_prod_http, :accepts_html, :browser])

    get("/keycloak", AuthController, :request)
    get("/keycloak/callback", AuthController, :callback)
  end

  scope "/auth", SkateWeb do
    pipe_through([:redirect_prod_http, :accepts_html, :browser, :auth, :ensure_auth])

    get("/:provider/logout", AuthController, :logout)
  end

  scope "/", SkateWeb do
    get "/_health", HealthController, :index
  end

  scope "/", SkateWeb do
    pipe_through [
      :redirect_prod_http,
      :accepts_html,
      :browser,
      :auth,
      :ensure_auth,
      :put_user_token
    ]

    get "/restricted", UnauthorizedController, :restricted_environment
  end

  scope "/", SkateWeb do
    pipe_through [
      :redirect_prod_http,
      :accepts_html,
      :browser,
      :capture_auth_return_path,
      :auth,
      :ensure_auth,
      :ensure_environment_access,
      :put_user_token
    ]

    get "/", PageController, :index
    get "/shuttle-map", PageController, :index
    get "/search", PageController, :index
    get "/map", PageController, :index
    get "/settings", PageController, :index
    get "/detours", PageController, :index
    get "/minimal", PageController, :index
    get "/minimal/:id", PageController, :index
    get "/unauthorized", UnauthorizedController, :index
  end

  scope "/", SkateWeb do
    pipe_through [
      :redirect_prod_http,
      :accepts_html,
      :browser,
      :capture_auth_return_path,
      :auth,
      :ensure_auth,
      :ensure_environment_access,
      :put_user_token,
      :ensure_admin_group
    ]

    get "/admin", AdminController, :index
    get "/detours_admin", DetoursAdminController, :index
    delete "/detours_admin", DetoursAdminController, :delete_all
    get "/reports", ReportController, :index
    get "/reports/:short_name", ReportController, :run
    get "/test_groups", TestGroupController, :index
    post "/test_groups/create", TestGroupController, :post
    get "/test_groups/:id", TestGroupController, :show
    delete "/test_groups/:id", TestGroupController, :delete
    get "/test_groups/:id/add_user", TestGroupController, :add_user_form
    post "/test_groups/:id/add_user", TestGroupController, :add_user
    post "/test_groups/:id/remove_user", TestGroupController, :remove_user
    post "/test_groups/:id/enable_override", TestGroupController, :enable_override
    post "/test_groups/:id/remove_override", TestGroupController, :remove_override
    get "/version", VersionController, :version
  end

  scope "/api", SkateWeb do
    pipe_through [:accepts_json, :browser, :auth, :ensure_auth, :ensure_environment_access]

    get "/routes", RouteController, :index
    get "/routes/:route_id", RouteController, :show
    get "/route_patterns/route/:route_id", RoutePatternController, :route
    get "/shapes/route/:route_id", ShapeController, :route
    get "/shapes/trip/:trip_id", ShapeController, :trip
    get "/stops/stations", StopController, :stations
    get "/stops", StopController, :index
    get "/shuttles", ShuttleController, :index
    get "/schedule/run", ScheduleController, :run
    get "/schedule/block", ScheduleController, :block
    get "/intersection", IntersectionController, :intersection
    put "/user_settings", UserSettingsController, :update
    put "/route_tabs", RouteTabsController, :update
    put "/notification_read_state", NotificationReadStatesController, :update
    get "/swings", SwingsController, :index
    get "/location_search/place/:id", LocationSearchController, :get
    get "/location_search/search", LocationSearchController, :search
    get "/location_search/suggest", LocationSearchController, :suggest
    post "/detours/directions/", DetourRouteController, :directions
    put "/detours/update_snapshot", DetoursController, :update_snapshot
    get "/detours/get_detours", DetoursController, :get_detours
    post "/detours/unfinished_detour", DetoursController, :unfinished_detour
    post "/detours/finished_detour", DetoursController, :finished_detour
  end

  defp put_user_token(conn, _) do
    token = Guardian.Plug.current_token(conn)
    assign(conn, :user_token, token)
  end
end
