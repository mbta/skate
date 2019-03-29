defmodule SkateWeb.RouteController do
  use SkateWeb, :controller

  def index(conn, _params) do
    routes = Gtfs.Query.all_routes()
    json(conn, %{data: routes})
  end
end
