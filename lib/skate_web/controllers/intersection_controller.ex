defmodule SkateWeb.IntersectionController do
  use SkateWeb, :controller

  @spec intersection(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def intersection(conn, %{"latitude" => latitude, "longitude" => longitude}) do
    IO.inspect({latitude, longitude}, label: :intersection_request)
    result = [latitude, longitude]
    IO.inspect(result, label: :intersection_result)
    json(conn, %{data: result})
  end
end
