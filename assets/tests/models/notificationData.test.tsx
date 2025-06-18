import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import {
  isBlockWaiverNotification,
  Notification,
  NotificationType,
} from "../../src/realtime"
import {
  NotificationData,
  notificationFromData,
} from "../../src/models/notificationData"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"

jest.mock("../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(getTestGroups).mockReturnValue([])
})

describe("notificationFromData", () => {
  test("handles a null endTime", () => {
    const data: NotificationData = {
      id: "1",
      created_at: new Date(0),
      state: "unread",
      content: {
        __struct__: NotificationType.BlockWaiver,
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

  describe("Detour Expiration Notifications", () => {
    test.each([
      { groups: [TestGroups.DetoursPilot], result: true },
      { groups: [], result: false },
    ])(
      "Sets `isDispatcher=$result` if Test Groups $groups are enabled",
      ({ result, groups }) => {
        jest.mocked(getTestGroups).mockReturnValue(groups)

        const notification = notificationFromData({
          created_at: new Date(0),
          id: "1",
          state: "unread",
          content: {
            __struct__: NotificationType.DetourExpiration,
            detour_id: 1,
            direction: "Outbound",
            estimated_duration: "1 hour",
            expires_in: 30,
            headsign: "headsign",
            origin: "origin",
            route: "17",
          },
        })

        if (notification.content.$type !== NotificationType.DetourExpiration) {
          throw "type mismatch"
        }

        expect(notification.content.isDispatcher).toBe(result)
      }
    )
  })
})
