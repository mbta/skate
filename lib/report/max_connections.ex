defmodule Report.MaxConnections do
  @moduledoc """
  Report Postgres' configured max_connections
  """

  @behaviour Report

  @impl Report
  def run() do
    {:ok, %Postgrex.Result{rows: [[max_connections]]}} =
      Ecto.Adapters.SQL.query(Skate.Repo, "SHOW max_connections")

    {:ok, [%{max_connections: max_connections}]}
  end

  @impl Report
  def short_name(), do: "max_connections"

  @impl Report
  def description(), do: "Postgres max_connections configuration"
end
