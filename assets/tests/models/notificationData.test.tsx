import { describe, test, expect } from "@jest/globals"
import {
  isBlockWaiverNotification,
  Notification,
  NotificationType,
} from "../../src/realtime"
import {
  NotificationData,
  notificationFromData,
} from "../../src/models/notificationData"

describe("notificationFromData", () => {
  test("handles a null endTime", () => {
    const data: NotificationData = {
      id: "1",
      created_at: new Date(0),
      state: "unread",
      content: {
        $type: NotificationType.BlockWaiver,
        created_at: new Date(0),
        reason: "manpower",
        route_ids: [],
        run_ids: [],
        trip_ids: [],
        operator_name: null,
        operator_id: null,
        route_id_at_creation: null,
        start_time: new Date(1234),
        end_time: null,
      },
    }

    const notification: Notification = notificationFromData(data)

    expect(
      isBlockWaiverNotification(notification) && notification.content.endTime
    ).toEqual(null)
  })
})
