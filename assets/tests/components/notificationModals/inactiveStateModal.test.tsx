import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import InactiveNotificationModal from "../../../src/components/notificationModals/inactiveNotificationModal"
import { Break, Piece, Run, Trip } from "../../../src/minischedule"
import { useMinischeduleRuns } from "../../../src/hooks/useMinischedule"
import { Notification, NotificationState } from "../../../src/realtime.d"
import * as dateTime from "../../../src/util/dateTime"

jest.mock("../../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRuns: jest.fn(),
}))

jest.spyOn(dateTime, "serviceDaySeconds").mockImplementation(() => 1000)

describe("InactiveNotificationModal", () => {
  const notification: Notification = {
    id: "123",
    createdAt: new Date(),
    reason: "other",
    routeIds: [],
    runIds: [],
    tripIds: ["123", "456", "789"],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date("2020-10-05"),
    endTime: new Date("2020-10-06"),
    state: "unread" as NotificationState,
  }
  const futureNotification = {
    ...notification,
    startTime: new Date("20200-10-05"),
  }

  const revenueTrip: Trip = {
    id: "trip",
    blockId: "block",
    routeId: "R",
    headsign: "Revenue",
    directionId: 1,
    viaVariant: "X",
    runId: "111",
    startTime: 900,
    endTime: 1100,
    startPlace: "Red Square",
    endPlace: "Blue Triangle",
  }

  const piece: Piece = {
    runId: "111",
    blockId: "block",
    startTime: 900,
    startPlace: "start",
    trips: [revenueTrip],
    endTime: 1100,
    endPlace: "end",
    startMidRoute: null,
    endMidRoute: false,
  }

  const breakk: Break = {
    breakType: "Split break",
    startTime: 900,
    endTime: 1100,
    endPlace: "spot",
  }

  test("renders loading message", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => undefined)
    const { baseElement } = render(
      <InactiveNotificationModal notification={notification} />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with no runs", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [])
    const { baseElement } = render(
      <InactiveNotificationModal notification={notification} />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with one current run", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [piece],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...notification, runIds: ["111"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with multiple current runs", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [piece],
      } as Run,
      {
        id: "222",
        activities: [{ ...piece, startTime: 1200, endTime: 1400 }],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...notification, runIds: ["111", "222"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with one upcoming run", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [{ ...piece, startTime: 1100, endTime: 1300 }],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...futureNotification, runIds: ["111"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with multiple upcoming runs", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [{ ...piece, startTime: 1100, endTime: 1300 }],
      } as Run,
      {
        id: "222",
        activities: [{ ...piece, startTime: 1400, endTime: 1600 }],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...futureNotification, runIds: ["111", "222"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with a run currently on break", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [breakk],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...notification, runIds: ["111"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with a run that finished in the past", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [
          {
            ...piece,
            startTime: 500,
            endTime: 700,
            trips: [{ ...revenueTrip, startTime: 500, endTime: 700 }],
          },
        ],
      } as Run,
      {
        id: "222",
        activities: [
          {
            ...piece,
            startTime: 700,
            endTime: 900,
            trips: [{ ...revenueTrip, startTime: 700, endTime: 900 }],
          },
        ],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...futureNotification, runIds: ["111", "222"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with a run that has only nonrevenue work left", () => {
    ;(useMinischeduleRuns as jest.Mock).mockImplementationOnce(() => [
      {
        id: "222",
        activities: [
          {
            ...piece,
            startTime: 700,
            endTime: 1100,
            trips: [
              { ...revenueTrip, startTime: 700, endTime: 900 },
              { ...revenueTrip, routeId: null, startTime: 900, endTime: 1100 },
            ],
          },
        ],
      } as Run,
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={{ ...futureNotification, runIds: ["111", "222"] }}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })
})
