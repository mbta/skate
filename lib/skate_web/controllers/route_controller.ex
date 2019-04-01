defmodule SkateWeb.RouteController do
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    routes = Gtfs.all_routes()
    json(conn, %{data: routes})
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    timepoint_ids = Gtfs.timepoints_on_route(route_id)
    json(conn, %{data: timepoint_ids})
  end
end
