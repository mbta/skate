import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import InactiveNotificationModal from "../../../src/components/notificationModals/inactiveNotificationModal"
import { Break, Piece, Trip } from "../../../src/minischedule"
import { useMinischeduleRuns } from "../../../src/hooks/useMinischedule"
import * as dateTime from "../../../src/util/dateTime"
import { blockWaiverNotificationFactory } from "../../factories/notification"
import { TripFactory } from "../../factories/trip"

jest.mock("../../../src/hooks/useMinischedule")

beforeEach(() => {
  jest.mocked(useMinischeduleRuns).mockReturnValue(undefined)
})

jest.spyOn(dateTime, "serviceDaySeconds").mockImplementation(() => 1000)

const otherNotificationFactory = blockWaiverNotificationFactory.params({
  content: { reason: "other" },
})

const futureNotificationFactory = otherNotificationFactory.params({
  // `100_000`ms _should_ be longer than it takes to execute the test?..
  content: { startTime: new Date(Date.now() + 100_000) },
})

describe("InactiveNotificationModal", () => {
  const revenueTrip: Trip = TripFactory.build({
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
  })

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
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => undefined)
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={blockWaiverNotificationFactory.build()}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with no runs", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={otherNotificationFactory.build({
          content: {
            runIds: [],
          },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with one current run", () => {
    jest.mocked(useMinischeduleRuns).mockReturnValue([
      {
        id: "111",
        activities: [piece],
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={otherNotificationFactory.build({
          content: {
            runIds: ["111"],
            startTime: new Date(0),
            endTime: new Date(1),
          },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with multiple current runs", () => {
    jest.mocked(useMinischeduleRuns).mockReturnValue([
      {
        id: "111",
        activities: [piece],
      },
      {
        id: "222",
        activities: [{ ...piece, startTime: 1200, endTime: 1400 }],
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={otherNotificationFactory.build({
          content: {
            runIds: ["111", "222"],
            startTime: new Date(0),
            endTime: new Date(1),
          },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with one upcoming run", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [{ ...piece, startTime: 1100, endTime: 1300 }],
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={futureNotificationFactory.build({
          content: { runIds: ["111"] },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with multiple upcoming runs", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [{ ...piece, startTime: 1100, endTime: 1300 }],
      },
      {
        id: "222",
        activities: [{ ...piece, startTime: 1400, endTime: 1600 }],
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={futureNotificationFactory.build({
          content: { runIds: ["111", "222"] },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with a run currently on break", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [
      {
        id: "111",
        activities: [breakk],
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={otherNotificationFactory.build({
          content: { runIds: ["111"] },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with a run that finished in the past", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [
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
      },
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
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={futureNotificationFactory.build({
          content: { runIds: ["111", "222"] },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("renders for a notification with a run that has only nonrevenue work left", () => {
    jest.mocked(useMinischeduleRuns).mockImplementationOnce(() => [
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
      },
    ])
    const { baseElement } = render(
      <InactiveNotificationModal
        notification={futureNotificationFactory.build({
          content: { runIds: ["111", "222"] },
        })}
      />
    )
    expect(baseElement).toMatchSnapshot()
  })
})
