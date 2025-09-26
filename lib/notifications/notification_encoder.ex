defmodule Notifications.NotificationEncoder do
  @moduledoc """
  Module for encoding database notifications into domain notifications.
  """

  alias Notifications.Db.{BlockWaiver, BridgeMovement, Detour, DetourExpiration, Notification}
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Notification

  require Logger

  @spec from_db_notification(DbNotification.t()) :: Notification.t()
  def from_db_notification(%DbNotification{} = db_notification) do
    %Notification{
      id: db_notification.id,
      created_at: db_notification.created_at,
      state: db_notification.state,
      content: content_from_db_notification(db_notification)
    }
  end

  defp content_from_db_notification(%DbNotification{block_waiver: %BlockWaiver{} = bw}), do: bw

  defp content_from_db_notification(%DbNotification{bridge_movement: %BridgeMovement{} = bm}),
    do: bm

  defp content_from_db_notification(%DbNotification{detour: %Detour{} = detour}), do: detour

  defp content_from_db_notification(%DbNotification{
         detour_expiration: %DetourExpiration{} = detour_expiration
       }) do
    update_in(
      detour_expiration.expires_in,
      &convert_duration_to_valid_minutes/1
    )
  end

  defp convert_duration_to_valid_minutes(%Duration{
         year: 0,
         month: 0,
         week: 0,
         day: 0,
         hour: 0,
         minute: 0,
         second: seconds,
         microsecond: {0, _}
       }) do
    case seconds do
      1800 ->
        30

      0 ->
        0

      seconds ->
        Logger.error("unknown seconds value second=#{seconds}")
        0
    end
  end
end
