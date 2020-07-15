defmodule SkateWeb.IntersectionController do
  use SkateWeb, :controller

  @spec intersection(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def intersection(conn, %{"latitude" => latitude, "longitude" => longitude}) do
    IO.inspect({latitude, longitude}, label: :intersection_request)

    intersection_fn =
      Application.get_env(:skate, :intersection_fn, &Geonames.nearest_intersection/2)

    result = intersection_fn.(latitude, longitude)
    IO.inspect(result, label: :intersection_result)
    json(conn, %{data: result})
  end
end
