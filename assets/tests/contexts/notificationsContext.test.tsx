import { act as hooksAct, renderHook } from "@testing-library/react-hooks"
import { mount } from "enzyme"
import React, { useContext } from "react"
import { act as testUtilsAct } from "react-dom/test-utils"
import {
  NotificationsContext,
  NotificationsProvider,
} from "../../src/contexts/notificationsContext"
import { useNotifications } from "../../src/hooks/useNotifications"
import { Notification } from "../../src/realtime.d"
import { now } from "../../src/util/dateTime"
import { mockUseStateOnce } from "../testHelpers/mockHelpers"

jest.mock("../../src/hooks/useNotifications", () => ({
  __esModule: true,
  useNotifications: jest.fn(),
}))

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

const notification: Notification = {
  id: 0,
  createdAt: now(),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: now(),
}

// tslint:disable: react-hooks-nesting

describe("Notification", () => {
  test("starts empty", () => {
    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    expect(result.current.notifications).toEqual([])
  })

  test("receives incoming notifications", () => {
    let handler: (notification: Notification) => void
    ;(useNotifications as jest.Mock).mockImplementationOnce((h) => {
      handler = h
    })
    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    expect(result.current.notifications).toHaveLength(0)
    hooksAct(() => {
      handler!(notification)
    })
    expect(result.current.notifications).toHaveLength(1)
  })

  test("makes a fullstory event when a notification arrives", () => {
    let handler: (notification: Notification) => void
    ;(useNotifications as jest.Mock).mockImplementationOnce((h) => {
      handler = h
    })
    mount(<NotificationsProvider children={<></>} />)
    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }
    window.username = "username"
    testUtilsAct(() => {
      handler!(notification)
    })
    expect(window.FS!.event).toHaveBeenCalledWith("Notification delivered", {
      num_stacked_int: 1,
    })
    window.FS = originalFS
    window.username = originalUsername
  })

  test("can close notification", () => {
    mockUseStateOnce([notification])
    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    expect(result.current.notifications).toHaveLength(1)
    hooksAct(() => {
      result.current.removeNotification(notification.id)
    })
    expect(result.current.notifications).toHaveLength(0)
  })
})
