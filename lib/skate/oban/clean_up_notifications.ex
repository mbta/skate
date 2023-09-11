defmodule Skate.Oban.CleanUpNotifications do
  @moduledoc """
  Cleans up arg:`limit` records older than arg:`cutoff_days` days.
  """

  require Logger

  use Oban.Worker,
    queue: :default,
    unique: [period: 300]

  import Ecto.Query

  @seconds_per_day 24 * 60 * 60

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    cutoff_days = Map.get(args, "cutoff_days", 100)
    limit = Map.get(args, "limit", 100)

    oldest_date = DateTime.utc_now() |> DateTime.add(-cutoff_days * @seconds_per_day)

    Logger.notice("#{__MODULE__} starting cleanup")

    {time, {count, nil}} =
      :timer.tc(fn ->
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
        |> Skate.Repo.delete_all()
      end)

    Logger.notice(
      "#{__MODULE__} finished cleanup deleted=#{count} time_in_ms=#{time / :timer.seconds(1)}"
    )

    {:ok, count}
  end
end
