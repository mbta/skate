import {
  NotificationReason,
  ChelseaBridgeNotificationReason,
} from "../realtime"

export function isChelseaBridgeNotification(
  reason: NotificationReason
): reason is ChelseaBridgeNotificationReason {
  return (
    reason === "chelsea_st_bridge_lowered" ||
    reason === "chelsea_st_bridge_raised"
  )
}
