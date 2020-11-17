import { act as hooksAct, renderHook } from "@testing-library/react-hooks"
import { mount } from "enzyme"
import React, { useContext } from "react"
import { act as testUtilsAct } from "react-dom/test-utils"
import {
  NotificationsContext,
  NotificationsProvider,
} from "../../src/contexts/notificationsContext"
import useCurrentTime from "../../src/hooks/useCurrentTime"
import { useNotifications } from "../../src/hooks/useNotifications"
import { Notification } from "../../src/realtime.d"
import { mockUseStateOnce } from "../testHelpers/mockHelpers"

jest.mock("../../src/hooks/useCurrentTime", () => ({
  __esModule: true,
  default: jest.fn(() => new Date(0)),
}))

jest.mock("../../src/hooks/useNotifications", () => ({
  __esModule: true,
  useNotifications: jest.fn(),
}))

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

const notification: Notification = {
  id: "0",
  createdAt: new Date(0),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(0),
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

  test("can hide notification", () => {
    mockUseStateOnce([notification])
    mockUseStateOnce(true)
    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    expect(result.current.showLatestNotification).toEqual(true)
    hooksAct(() => {
      result.current.hideNotification()
    })
    expect(result.current.showLatestNotification).toEqual(false)
  })

  test("expires notifications after 8 hours", () => {
    const maxAge = 8 * 60 * 60 * 1000

    jest.useFakeTimers()

    let handler: (notification: Notification) => void
    ;(useNotifications as jest.Mock).mockImplementationOnce((h) => {
      handler = h
    })
    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    ;(useCurrentTime as jest.Mock).mockImplementationOnce(() => {
      return new Date(0)
    })
    hooksAct(() => {
      handler!(notification)
    })
    hooksAct(() => {
      jest.runOnlyPendingTimers()
      // This seems like it should work if we put the mock outside the
      // hooksAct block, but it doesn't.
      ;(useCurrentTime as jest.Mock).mockImplementationOnce(() => {
        return new Date(maxAge)
      })
    })
    expect(result.current.notifications).toHaveLength(1)
    hooksAct(() => {
      jest.runOnlyPendingTimers()
    })
    expect(result.current.notifications).toHaveLength(0)
  })
})
