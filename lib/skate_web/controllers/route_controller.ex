defmodule SkateWeb.RouteController do
  use SkateWeb, :controller

  alias Schedule.Gtfs.Route

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    routes_fn = Application.get_env(:skate_web, :routes_fn, &Schedule.all_routes/0)

    routes = Enum.reject(routes_fn.(), &Route.shuttle_route?/1)

    json(conn, %{data: routes})
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    timepoints_on_route_fn =
      Application.get_env(:skate_web, :timepoints_on_route_fn, &Schedule.timepoints_on_route/1)

    timepoints = timepoints_on_route_fn.(route_id)
    json(conn, %{data: timepoints})
  end
end
