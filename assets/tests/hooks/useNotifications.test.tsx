import { describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { useNotifications } from "../../src/hooks/useNotifications"
import { NotificationData } from "../../src/models/notificationData"
import { Notification, NotificationState } from "../../src/realtime"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

const notification1: Notification = {
  id: "0",
  createdAt: new Date(0),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: ["trip1", "trip2"],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(0),
  endTime: new Date(100_000),
  state: "unread" as NotificationState,
}

const notification1Data: NotificationData = {
  id: 0,
  created_at: 0,
  reason: "manpower",
  route_ids: ["route1", "route2"],
  run_ids: ["run1", "run2"],
  trip_ids: ["trip1", "trip2"],
  operator_name: null,
  operator_id: null,
  route_id_at_creation: null,
  start_time: 0,
  end_time: 100,
  state: "unread",
}

const notification2: Notification = {
  id: "1",
  createdAt: new Date(0),
  reason: "accident",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(0),
  endTime: new Date(100_000),
  state: "unread" as NotificationState,
}

const notification2Data: NotificationData = {
  id: 1,
  created_at: 0,
  reason: "accident",
  route_ids: ["route1", "route2"],
  run_ids: ["run1", "run2"],
  trip_ids: [],
  operator_name: null,
  operator_id: null,
  route_id_at_creation: null,
  start_time: 0,
  end_time: 100,
  state: "unread",
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

  test("parses initial notification message", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockChannel.on.mockImplementation((_event, handler) => {
      handler({
        data: notification1Data,
      })
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
