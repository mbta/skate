defmodule SkateWeb.ShapeController do
  use SkateWeb, :controller

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    shapes_fn = Application.get_env(:skate_web, :shapes_fn, &Gtfs.shapes/1)
    shapes = shapes_fn.(route_id)

    json(conn, %{data: shapes})
  end
end
