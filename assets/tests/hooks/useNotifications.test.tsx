import { describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { useNotifications } from "../../src/hooks/useNotifications"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import { Notification, NotificationType } from "../../src/realtime"
import { blockWaiverNotificationFactory } from "../factories/notification"

const notification1: Notification = blockWaiverNotificationFactory.build({
  id: "0",
  state: "unread",
  createdAt: new Date(0),
  content: {
    reason: "manpower",
    createdAt: new Date(0),
    routeIds: ["route1", "route2"],
    runIds: ["run1", "run2"],
    tripIds: ["trip1", "trip2"],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date(0),
    endTime: new Date(100_000),
  },
})

const notification1Data = {
  id: 0,
  created_at: 0,
  state: "unread",
  content: {
    $type: NotificationType.BlockWaiver,
    reason: "manpower",
    created_at: 0,
    route_ids: ["route1", "route2"],
    run_ids: ["run1", "run2"],
    trip_ids: ["trip1", "trip2"],
    operator_name: null,
    operator_id: null,
    route_id_at_creation: null,
    start_time: 0,
    end_time: 100,
  },
}

const notification2: Notification = blockWaiverNotificationFactory.build({
  id: "1",
  state: "unread",
  createdAt: new Date(0),
  content: {
    reason: "accident",
    createdAt: new Date(0),
    routeIds: ["route1", "route2"],
    runIds: ["run1", "run2"],
    tripIds: [],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date(0),
    endTime: new Date(100_000),
  },
})

const notification2Data = {
  id: 1,
  state: "unread",
  created_at: 0,
  content: {
    $type: NotificationType.BlockWaiver,
    reason: "accident",
    created_at: 0,
    route_ids: ["route1", "route2"],
    run_ids: ["run1", "run2"],
    trip_ids: [],
    operator_name: null,
    operator_id: null,
    route_id_at_creation: null,
    start_time: 0,
    end_time: 100,
  },
}

describe("useNotifications", () => {
  test("current value is null when loading", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const { result } = renderHook(() => useNotifications(mockSocket))
    expect(result.current).toBeNull()
  })

  test("parses initial notification message", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", {
      data: {
        initial_notifications: [notification1Data, notification2Data],
      },
    })
    mockSocket.channel.mockImplementation(() => mockChannel)
    const { result } = renderHook(() => useNotifications(mockSocket))
    expect(result.current).toStrictEqual({
      type: "initial",
      payload: [notification1, notification2],
    })
  })

  test("parses notification message", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "notification") {
        handler({
          data: notification1Data,
        })
      }
      return 1
    })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const { result } = renderHook(() => useNotifications(mockSocket))
    expect(result.current).toStrictEqual({
      type: "new",
      payload: notification1,
    })
  })
})
