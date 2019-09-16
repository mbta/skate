defmodule SkateWeb.Router do
  use SkateWeb, :router

  pipeline :redirect_prod_http do
    if Application.get_env(:skate, :redirect_http?) do
      plug(Plug.SSL, rewrite_on: [:x_forwarded_proto])
    end
  end

  pipeline :auth do
    plug(SkateWeb.AuthManager.Pipeline)
  end

  pipeline :ensure_auth do
    plug(Guardian.Plug.EnsureAuthenticated)
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

  scope "/auth", SkateWeb do
    pipe_through([:redirect_prod_http, :accepts_html, :browser])

    get("/:provider", AuthController, :request)
    get("/:provider/callback", AuthController, :callback)
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

    get "/", PageController, :index
    get "/shuttle-map", PageController, :index
    get "/about", PageController, :index
    get "/settings", PageController, :index
  end

  scope "/api", SkateWeb do
    pipe_through [:accepts_json, :browser, :auth, :ensure_auth]

    get "/routes", RouteController, :index
    get "/routes/:route_id", RouteController, :show
    get "/shapes/:route_id", ShapeController, :show
    get "/shuttles", ShuttleController, :index
  end

  scope "/_flags" do
    pipe_through [
      :redirect_prod_http,
      :accepts_html,
      :browser,
      :auth,
      :ensure_auth
    ]

    forward("/", Laboratory.Router)
  end

  defp put_user_token(conn, _) do
    token = Guardian.Plug.current_token(conn)
    assign(conn, :user_token, token)
  end
end
