import { describe, test, expect } from "@jest/globals"
import { Notification } from "../../src/realtime"
import {
  NotificationData,
  notificationFromData,
} from "../../src/models/notificationData"

describe("notificationFromData", () => {
  test("handles a null endTime", () => {
    const data: NotificationData = {
      id: 1,
      created_at: 0,
      reason: "manpower",
      route_ids: [],
      run_ids: [],
      trip_ids: [],
      operator_name: null,
      operator_id: null,
      route_id_at_creation: null,
      start_time: 1234,
      end_time: null,
      state: "unread",
    }

    const notification: Notification = notificationFromData(data)
    expect(notification.endTime).toEqual(null)
  })
})
