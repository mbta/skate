defmodule SkateWeb.RouteController do
  use SkateWeb, :controller

  alias Static.Gtfs.Route

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    routes_fn = Application.get_env(:skate_web, :routes_fn, &Static.all_routes/0)

    routes =
      routes_fn.()
      |> Enum.reject(&Route.shuttle_route?/1)

    json(conn, %{data: routes})
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    timepoints_on_route_fn =
      Application.get_env(:skate_web, :timepoints_on_route_fn, &Static.timepoints_on_route/1)

    timepoints = timepoints_on_route_fn.(route_id)
    json(conn, %{data: timepoints})
  end
end
