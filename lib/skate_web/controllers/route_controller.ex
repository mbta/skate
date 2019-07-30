defmodule SkateWeb.RouteController do
  use SkateWeb, :controller

  alias Gtfs.Route

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    routes_fn = Application.get_env(:skate_web, :routes_fn, &Gtfs.all_routes/0)

    routes =
      routes_fn.()
      |> Enum.reject(&shuttle_route?/1)

    json(conn, %{data: routes})
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    timepoint_ids_on_route_fn =
      Application.get_env(:skate_web, :timepoint_ids_on_route_fn, &Gtfs.timepoint_ids_on_route/1)

    timepoint_ids = timepoint_ids_on_route_fn.(route_id)
    json(conn, %{data: timepoint_ids})
  end

  defp shuttle_route?(%Route{description: "Rail Replacement Bus"}), do: true
  defp shuttle_route?(%Route{}), do: false
end
