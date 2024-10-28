defmodule SkateWeb.ShuttleController do
  use SkateWeb, :controller

  alias Schedule.Gtfs.Route

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    routes_fn = Application.get_env(:skate_web, :routes_fn, &Schedule.all_routes/0)

    routes =
      routes_fn.()
      |> Enum.filter(fn route -> Route.shuttle_route?(route) && has_shape?(route) end)
      |> Enum.map(&use_route_pattern_name/1)

    json(conn, %{data: routes})
  end

  @spec use_route_pattern_name(Route.t()) :: Route.t()
  defp use_route_pattern_name(route) do
    route_pattern_fn =
      Application.get_env(
        :skate_web,
        :route_pattern_fn,
        &Schedule.first_route_pattern_for_route_and_direction/2
      )

    route_pattern = route_pattern_fn.(route.id, 0)

    name = if route_pattern, do: route_pattern.name, else: route.name

    Map.put(route, :name, name)
  end

  @spec has_shape?(Route.t()) :: boolean()
  defp has_shape?(route) do
    shapes_fn = Application.get_env(:skate_web, :shapes_fn, &Schedule.shapes/1)
    length(shapes_fn.(route.id)) > 0
  end
end
