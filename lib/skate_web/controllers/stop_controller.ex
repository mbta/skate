defmodule SkateWeb.StopController do
  use SkateWeb, :controller

  @spec stations(Plug.Conn.t(), map()) :: Plug.Conn.t()
  @doc """
  Get all stations
  """
  def stations(conn, _params) do
    stations_fn = Application.get_env(:skate_web, :stations_fn, &Schedule.stations/0)
    stations = stations_fn.()

    json(conn, %{data: stations})
  end

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  @doc """
  Get all stops
  """
  def index(conn, _params) do
    none_match = List.first(Plug.Conn.get_req_header(conn, "if-none-match"))
    version_fn = Application.get_env(:skate_web, :version_fn, &Schedule.version/0)

    etag = String.replace(version_fn.(), ",", "-")

    if etag === none_match do
      send_resp(conn, 304, "")
    else
      stops_fn = Application.get_env(:skate_web, :stops_fn, &Schedule.all_stops/0)
      stops = stops_fn.()

      conn
      |> put_resp_header("cache-control", "stale-while-revalidate")
      |> put_resp_header("etag", etag)
      |> json(%{data: stops})
    end
  end
end
