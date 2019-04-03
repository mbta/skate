defmodule SkateWeb.LadderController do
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    render(conn, "index.html", routes: Gtfs.all_routes())
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    render(conn, "route.html", timepoint_ids: Gtfs.timepoints_on_route(route_id))
  end
end
