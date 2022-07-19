import { act as hooksAct, renderHook } from "@testing-library/react-hooks"
import React, { ReactNode, useContext } from "react"
import {
  NotificationsContext,
  NotificationsProvider,
  otherNotificationReadState,
} from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useCurrentTime from "../../src/hooks/useCurrentTime"
import { useNotifications } from "../../src/hooks/useNotifications"
import { Notification, NotificationState } from "../../src/realtime.d"
import {
  initialState,
  selectVehicleFromNotification,
  State,
} from "../../src/state"
import vehicleFactory from "../factories/vehicle"

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

const vehicle = vehicleFactory.build()

jest.mock("../../src/hooks/useVehicleForNotification", () => ({
  __esModule: true,
  default: jest.fn(() => vehicle),
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
  endTime: new Date(100),
  state: "unread" as NotificationState,
}

describe("NotificationsProvider", () => {
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

  test("selects vehicle from notification", () => {
    const stateDispatch = jest.fn()

    const wrapper = ({
      children,
      state,
    }: {
      children?: ReactNode
      state: State
    }) => (
      <StateDispatchProvider state={state} dispatch={stateDispatch}>
        <NotificationsProvider>
          <> {children} </>
        </NotificationsProvider>
      </StateDispatchProvider>
    )

    const { rerender } = renderHook(() => useContext(NotificationsContext), {
      wrapper,
      initialProps: { state: initialState },
    })

    rerender({ state: { ...initialState, selectedNotification: notification } })

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
