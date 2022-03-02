defmodule SkateWeb.SwingsController do
  use SkateWeb, :controller

  def index(conn, %{"route_ids" => route_ids}) do
    swings_fn = Application.get_env(:skate_web, :swings_fn, &Schedule.swings_for_route/3)
    now_fn = Application.get_env(:skate_web, :now_fn, &Util.Time.now/0)

    now = now_fn.()

    swings =
      route_ids
      |> String.split(",")
      |> Enum.flat_map(fn route_id -> swings_fn.(route_id, now, now) end)
      |> Enum.uniq_by(fn swing -> {swing.from_run_id, swing.to_run_id} end)

    json(conn, %{data: swings})
  end
end
