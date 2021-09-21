defmodule SkateWeb.ScheduleController do
  use SkateWeb, :controller

  @spec run(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def run(conn, %{"trip_id" => trip_id, "run_id" => run_id}) when not is_nil(run_id) do
    run_fn = Application.get_env(:skate, :schedule_run_fn, &Schedule.run_for_trip/2)

    run = run_fn.(run_id, trip_id)

    json(conn, %{data: run})
  end

  def run(conn, %{"trip_id" => trip_id}) do
    run_fn = Application.get_env(:skate, :schedule_run_fn, &Schedule.run_for_trip/2)

    run = run_fn.(nil, trip_id)

    json(conn, %{data: run})
  end

  @spec block(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def block(conn, %{"trip_id" => trip_id}) do
    block_fn = Application.get_env(:skate, :schedule_block_fn, &Schedule.block_for_trip/1)

    block = block_fn.(trip_id)

    json(conn, %{data: block})
  end
end
