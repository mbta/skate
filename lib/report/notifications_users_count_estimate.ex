defmodule Report.NotificationsUsersCountEstimate do
  @moduledoc """
  Returns the Postgres estimated count of entries in the notifications table,
  for evaluating options to delete old entries
  """
  import Ecto.Query

  @behaviour Report

  @impl Report
  def run() do
    [count] =
      Skate.Repo.all(
        from(p in "pg_class", where: p.relname == "notifications_users", select: p.reltuples)
      )

    {:ok, [%{count: count}]}
  end

  @impl Report
  def short_name(), do: "notifications_users_count_estimate"

  @impl Report
  def description(), do: "Estimated count of notifications_users"
end
