defmodule SkateWeb.StopListController do
  use SkateWeb, :controller

  def index(conn, _params) do
    stops = Gtfs.Query.all_stops()
    json(conn, %{data: stops})
  end
end
