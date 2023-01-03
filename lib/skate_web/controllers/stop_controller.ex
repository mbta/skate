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
end
