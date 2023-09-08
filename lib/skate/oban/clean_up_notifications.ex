defmodule Skate.Oban.CleanUpNotifications do
  use Oban.Worker,
    queue: :default,
    unique: [period: 300]

  import Ecto.Query

  @seconds_per_day 24 * 60 * 60

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    oldest_date = DateTime.now!("Etc/UTC") |> DateTime.add(-100 * @seconds_per_day)

    from(n in Notifications.Db.Notification,
      where: n.created_at < ^oldest_date,
      limit: 100
    )
    |> Skate.Repo.delete_all()

    :ok
  end
end
