defmodule Skate.BlockWaivers do
  alias Notifications.NotificationReason
  alias Realtime.{BlockWaiver, Ghost, Vehicle}
  alias Schedule.Block

  def create_block_waiver_notifications(block_waivers) do
    block_waivers
    |> Enum.each(&Notifications.Notification.create_block_waiver_notification/1)
  end
end
