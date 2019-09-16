defmodule SkateWeb.ShapeController do
  use SkateWeb, :controller

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id}) do
    shape_fn = Application.get_env(:skate_web, :shape_fn, &Gtfs.shape/1)
    shape = shape_fn.(route_id)

    json(conn, %{data: shape})
  end
end
