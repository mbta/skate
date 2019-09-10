defmodule SkateWeb.PageController do
  require Logger
  use SkateWeb, :controller
  alias SkateWeb.AuthManager

  plug(:laboratory_features)

  def index(conn, _params) do
    uid = AuthManager.Plug.current_resource(conn)
    _ = Logger.info("uid=#{uid}")

    conn
    |> assign(:username, uid)
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
