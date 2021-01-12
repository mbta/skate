defmodule Notifications.BlockWaiverBackfiller do
  use GenServer
  import Ecto.Query
  alias Notifications.Db.Notification, as: DbNotification
  require Logger

  @sleep_interval 5000

  @batch_size 5

  @spec default_name() :: GenServer.name()
  def default_name(), do: Notifications.NotificationServer

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, nil)
  end

  @impl true
  def init(_) do
    Process.send_after(self(), :backfill_batch, 0)
    {:ok, nil}
  end

  @impl true
  def handle_info(:backfill_batch, state) do
    notifications_requiring_backfill_count =
      Skate.Repo.one(
        from(n in DbNotification, select: count(n), where: is_nil(n.block_waiver_id))
      )

    Logger.info(
      "backfill_batch notifications_requiring_backfill_count=#{
        notifications_requiring_backfill_count
      }"
    )

    Skate.Repo.all(
      from(n in DbNotification, where: is_nil(n.block_waiver_id), limit: @batch_size)
    )
    |> Enum.each(&Notifications.Notification.duplicate_to_block_waiver/1)

    Process.send_after(self(), :backfill_batch, @sleep_interval)

    {:noreply, state}
  end
end
