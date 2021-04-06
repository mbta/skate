defmodule SkateWeb.SwingsController do
  use SkateWeb, :controller

  alias SkateWeb.AuthManager
  alias Skate.Settings.RouteSettings

  def index(conn, _params) do
    username = AuthManager.Plug.current_resource(conn)

    route_ids = username |> RouteSettings.get_or_create() |> Map.get(:selected_route_ids)

    swings_fn = Application.get_env(:skate_web, :swings_fn, &Schedule.swings_for_route/3)
    now_fn = Application.get_env(:skate_web, :now_fn, &Util.Time.now/0)

    now = now_fn.()

    swings =
      route_ids
      |> Enum.flat_map(fn route_id -> swings_fn.(route_id, now, now) end)
      |> Enum.sort_by(fn swing -> {swing.from_run_id, swing.to_run_id} end)
      |> Enum.dedup_by(fn swing -> {swing.from_run_id, swing.to_run_id} end)

    json(conn, %{data: swings})
  end
end
