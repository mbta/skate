defmodule SkateWeb.MinischeduleController do
  use SkateWeb, :controller

  @spec run(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def run(conn, %{"trip_id" => trip_id}) do
    run_fn = Application.get_env(:skate_web, :run_fn, &Schedule.minischedule_run/1)

    run = run_fn.(trip_id)

    json(conn, %{data: run})
  end

  @spec block(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def block(conn, %{"trip_id" => trip_id}) do
    block_fn = Application.get_env(:skate_web, :block_fn, &Schedule.minischedule_block/1)

    block = block_fn.(trip_id)

    json(conn, %{data: block})
  end
end
