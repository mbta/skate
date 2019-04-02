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
    pipe_through :browser

    get "/", PageController, :index
    get "/ladder", LadderController, :index
    get "/ladder/:route_id", LadderController, :show
  end

  scope "/api", SkateWeb do
    pipe_through :api

    get "/routes", RouteController, :index
    get "/routes/:route_id", RouteController, :show
  end
end
