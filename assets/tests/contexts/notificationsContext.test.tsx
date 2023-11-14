import { jest, describe, test, expect } from "@jest/globals"
import { act, renderHook } from "@testing-library/react"
import React, { ReactNode, useContext } from "react"
import {
  NotificationsContext,
  NotificationsProvider,
  otherNotificationReadState,
} from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useCurrentTime from "../../src/hooks/useCurrentTime"
import { Notification, NotificationState } from "../../src/realtime.d"
import { initialState } from "../../src/state"
import vehicleFactory from "../factories/vehicle"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import { useNotifications } from "../../src/hooks/useNotifications"
import notificationFactory from "../factories/notification"
import { fullStoryEvent } from "../../src/helpers/fullStory"
import { selectVehicleFromNotification } from "../../src/state/pagePanelState"

jest.mock("../../src/hooks/useCurrentTime", () => ({
  __esModule: true,
  default: jest.fn(() => new Date(0)),
}))

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

const vehicle = vehicleFactory.build()

jest.mock("../../src/hooks/useVehicleForNotification", () => ({
  __esModule: true,
  default: jest.fn(() => vehicle),
}))
jest.mock("../../src/hooks/useNotifications", () => ({
  __esModule: true,
  useNotifications: jest.fn(),
}))

jest.mock("../../src/helpers/fullStory")

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
  endTime: new Date(100),
  state: "unread" as NotificationState,
}

describe("NotificationsProvider", () => {
  test("starts empty", () => {
    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    expect(result.current.notifications).toBeNull()
  })

  test("receives incoming notifications and logs a tag manager event", () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    ;(useNotifications as jest.Mock).mockImplementationOnce(() => ({
      type: "initial",
      payload: [],
    }))

    const { result, rerender } = renderHook(
      () => useContext(NotificationsContext),
      {
        wrapper: NotificationsProvider,
      }
    )
    expect(result.current.notifications).toHaveLength(0)
    ;(useNotifications as jest.Mock).mockImplementationOnce(() => ({
      type: "new",
      payload: notification,
    }))

    rerender()

    expect(result.current.notifications).toHaveLength(1)
    expect(tagManagerEvent).toHaveBeenCalledWith("notification_delivered")
    expect(mockedFSEvent).toHaveBeenCalledWith(
      "User was Delivered a Notification",
      {}
    )
  })

  test("when receiving a bridge notification, should trigger FS event", () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    ;(useNotifications as jest.Mock).mockImplementationOnce(() => ({
      type: "initial",
      payload: [],
    }))

    const { result, rerender } = renderHook(
      () => useContext(NotificationsContext),
      {
        wrapper: NotificationsProvider,
      }
    )
    expect(result.current.notifications).toHaveLength(0)
    ;(useNotifications as jest.Mock).mockImplementationOnce(() => ({
      type: "new",
      payload: notificationFactory.build({
        reason: "chelsea_st_bridge_raised",
      }),
    }))

    rerender()

    expect(result.current.notifications).toHaveLength(1)
    expect(tagManagerEvent).toHaveBeenCalledWith("notification_delivered")
    expect(mockedFSEvent).toHaveBeenCalledWith(
      "User was Delivered a Chelsea Bridge Notification",
      {}
    )
  })

  test("expires notifications after 8 hours", () => {
    const maxAge = 8 * 60 * 60 * 1000

    jest.useFakeTimers()

    const { result } = renderHook(() => useContext(NotificationsContext), {
      wrapper: NotificationsProvider,
    })
    ;(useCurrentTime as jest.Mock).mockImplementationOnce(() => {
      return new Date(0)
    })
    ;(useNotifications as jest.Mock).mockImplementationOnce(() => ({
      type: "new",
      payload: notification,
    }))

    act(() => {
      jest.runOnlyPendingTimers()
      // This seems like it should work if we put the mock outside the
      // act block, but it doesn't.
      ;(useCurrentTime as jest.Mock).mockImplementationOnce(() => {
        return new Date(maxAge)
      })
    })
    expect(result.current.notifications).toHaveLength(1)
    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(result.current.notifications).toHaveLength(0)
  })

  test("selects vehicle from notification", () => {
    const stateDispatch = jest.fn()

    let state = initialState
    const wrapper = ({ children }: { children?: ReactNode }) => (
      <StateDispatchProvider state={state} dispatch={stateDispatch}>
        <NotificationsProvider>
          <> {children} </>
        </NotificationsProvider>
      </StateDispatchProvider>
    )

    const { rerender } = renderHook(() => useContext(NotificationsContext), {
      wrapper,
    })

    state = { ...initialState, selectedNotification: notification }
    rerender()

    expect(stateDispatch).toHaveBeenCalledWith(
      selectVehicleFromNotification(vehicle)
    )
  })
})

describe("otherNotificationReadState", () => {
  test("handles delete sensibly", () => {
    expect(otherNotificationReadState("deleted")).toEqual("deleted")
  })
})
