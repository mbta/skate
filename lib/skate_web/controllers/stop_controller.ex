defmodule SkateWeb.StopController do
  use SkateWeb, :controller

  @spec stations(Plug.Conn.t(), map()) :: Plug.Conn.t()
  @doc """
  Get all stations
  """
  def stations(conn, _params) do
    stations = Application.get_env(:skate_web, :shapes_fn, &Schedule.stations/1)
    stations = stations.()

    json(conn, %{data: stations})
  end
end
