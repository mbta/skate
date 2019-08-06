defmodule SkateWeb.TripController do
  use SkateWeb, :controller

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"route_id" => route_id, "start_time" => start_time, "end_time" => end_time}) do
    trips_fn =
      Application.get_env(:skate_web, :active_trips_on_route_fn, &Gtfs.active_trips_on_route/3)

    trips =
      trips_fn.(
        route_id,
        String.to_integer(start_time),
        String.to_integer(end_time)
      )

    json(conn, %{data: trips})
  end
end
