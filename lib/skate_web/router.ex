defmodule SkateWeb.Router do
  use SkateWeb, :router

  alias SkateWeb.AuthManager

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

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug(:api_auth)
  end

  scope "/auth", SkateWeb do
    pipe_through([:redirect_prod_http, :browser])

    get("/:provider", AuthController, :request)
    get("/:provider/callback", AuthController, :callback)
  end

  scope "/", SkateWeb do
    get "/_health", HealthController, :index
  end

  scope "/", SkateWeb do
    pipe_through [:redirect_prod_http, :browser, :auth, :ensure_auth, :put_user_token]

    get "/", PageController, :index
  end

  scope "/api", SkateWeb do
    pipe_through :api

    get "/routes", RouteController, :index
    get "/routes/:route_id", RouteController, :show
  end

  defp put_user_token(conn, _) do
    token = Guardian.Plug.current_token(conn)
    assign(conn, :user_token, token)
  end

  def api_auth(conn, _) do
    with [token] <- get_req_header(conn, "token"),
         {:ok, _claims} <- AuthManager.decode_and_verify(token) do
      conn
    else
      _ ->
        conn
        |> send_resp(401, "unauthorized")
        |> halt()
    end
  end
end
