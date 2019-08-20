defmodule SkateWeb.ShuttleController do
  use SkateWeb, :controller

  alias Gtfs.Route

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    routes_fn = Application.get_env(:skate_web, :routes_fn, &Gtfs.all_routes/0)

    routes =
      routes_fn.()
      |> Enum.filter(&Route.shuttle_route?/1)

    json(conn, %{data: routes})
  end
end
