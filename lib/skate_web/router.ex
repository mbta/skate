defmodule SkateWeb.Router do
  use SkateWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", SkateWeb do
    # no pipe
    get "/_health", HealthController, :index
  end

  scope "/", SkateWeb do
    pipe_through :browser

    get "/", PageController, :index
  end

  scope "/api", SkateWeb do
    pipe_through :api

    get "/routes", RouteController, :index
    get "/routes/:route_id", RouteController, :show
  end
end
