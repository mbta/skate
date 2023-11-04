defmodule Report.AuthenticationTimeout do
  @moduledoc """
  Report Postgres' configured authentication_timeout
  """

  @behaviour Report

  @impl Report
  def run() do
    {:ok, %Postgrex.Result{rows: [[authentication_timeout]]}} =
      Ecto.Adapters.SQL.query(Skate.Repo, "SHOW authentication_timeout")

    {:ok, [%{max_connections: authentication_timeout}]}
  end

  @impl Report
  def short_name(), do: "authentication_timeout"

  @impl Report
  def description(), do: "Postgres authentication_timeout configuration"
end
