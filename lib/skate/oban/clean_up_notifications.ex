defmodule Skate.Oban.CleanUpNotifications do
  @moduledoc """
  Cleans up arg:`limit` records older than arg:`cutoff_days` days.
  """

  require Logger

  use Oban.Worker,
    queue: :default,
    unique: [
      period: :infinity,
      states: [:scheduled, :available, :executing, :retryable]
    ]

  import Ecto.Query

  @seconds_per_day 24 * 60 * 60

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    cutoff_days = Map.get(args, "cutoff_days", 100)
    limit = Map.get(args, "limit", 100)

    oldest_date = DateTime.add(DateTime.utc_now(), -cutoff_days * @seconds_per_day)

    Logger.notice("starting cleanup")

    {time, {count, nil}} =
      :timer.tc(fn ->
        Skate.Repo.delete_all(
          from(notification_indexed in Notifications.Db.Notification,
            where:
              notification_indexed.id in subquery(
                from(notification_limited in Notifications.Db.Notification,
                  where: notification_limited.inserted_at < ^oldest_date,
                  limit: ^limit,
                  select: notification_limited.id
                )
              )
          )
        )
      end)

    Logger.notice("finished cleanup deleted=#{count} time_in_ms=#{time / :timer.seconds(1)}")

    {:ok, count}
  end
end
