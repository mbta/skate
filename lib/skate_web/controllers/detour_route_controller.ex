defmodule SkateWeb.DetourRouteController do
  @moduledoc """
  Detour API
  """
  use SkateWeb, :controller

  def directions(conn, params) do
    dbg(conn)
    dbg(params)
    render(conn, :result, dirs: Skate.DetourRoutes.directions([]))
    # conn
  end
end
