import { mount } from "enzyme"
import React from "react"
import { act } from "react-dom/test-utils"
import renderer from "react-test-renderer"
import {
  NotificationCard,
  Notifications,
} from "../../src/components/notifications"
import {
  NotificationsContext,
  NotificationsProvider,
} from "../../src/contexts/notificationsContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  hideLatestNotification,
  reducer as notificationsReducer,
  toggleReadState,
} from "../../src/hooks/useNotificationsReducer"
import { Notification, NotificationReason } from "../../src/realtime.d"
import { Dispatch, initialState, setNotification } from "../../src/state"
import { now } from "../../src/util/dateTime"
import { mockUseReducerOnce } from "../testHelpers/mockHelpers"

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
  createdAt: now(),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: now(),
  state: "unread",
}

const notificationWithMatchedVehicle: Notification = {
  ...notification,
  operatorName: "operatorName",
  operatorId: "operatorId",
  routeIdAtCreation: "route1",
}

describe("Notification", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<Notifications />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders latest notification", () => {
    const notifications = [
      { ...notification, id: "0" },
      { ...notification, id: "1" },
    ]

    const tree = renderer
      .create(
        <NotificationsContext.Provider
          value={{
            notifications,
            showLatestNotification: true,
            dispatch: jest.fn(),
            rememberScrollPosition: jest.fn(),
            scrollPosition: 0,
            notificationWithOpenSubmenuId: null,
            setNotificationWithOpenSubmenuId: jest.fn(),
          }}
        >
          <Notifications />
        </NotificationsContext.Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("can hide notification", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <NotificationsContext.Provider
        value={{
          notifications: [notification],
          showLatestNotification: true,
          dispatch,
          rememberScrollPosition: jest.fn(),
          scrollPosition: 0,
          notificationWithOpenSubmenuId: null,
          setNotificationWithOpenSubmenuId: jest.fn(),
        }}
      >
        <Notifications />
      </NotificationsContext.Provider>
    )
    expect(wrapper.find(".m-notifications__card")).toHaveLength(1)
    wrapper.find(".m-notifications__close").simulate("click")
    expect(dispatch).toHaveBeenCalledWith(hideLatestNotification())
  })
})

describe("NotificationCard", () => {
  test("renders notification with matched vehicle", () => {
    const tree = renderer
      .create(
        <NotificationCard
          notification={notificationWithMatchedVehicle}
          currentTime={now()}
          dispatch={jest.fn()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("transforms reasons into human-readable titles", () => {
    const n: Notification = { ...notification, reason: "operator_error" }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        currentTime={now()}
        dispatch={jest.fn()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
    expect(wrapper.html()).toContain("OPERATOR ERROR")
  })

  test("uses custom titles if available", () => {
    const n: Notification = { ...notification, reason: "manpower" }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        dispatch={jest.fn()}
        currentTime={now()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
    expect(wrapper.html()).toContain("NO OPERATOR")
  })

  test("renders a notification with an unexpected reason", () => {
    const n: Notification = { ...notification, reason: "other" }
    const tree = renderer
      .create(
        <NotificationCard
          notification={n}
          dispatch={jest.fn()}
          currentTime={now()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("routeIdAtCreation shows when relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "accident",
      routeIds: ["r2", "r3"],
      routeIdAtCreation: "r1",
    }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        dispatch={jest.fn()}
        currentTime={now()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
    expect(wrapper.html()).toContain("r1")
  })

  test("falls back to affected routeIds if routeIdAtCreation is missing", () => {
    const n: Notification = {
      ...notification,
      reason: "accident",
      routeIds: ["r2", "r3"],
      routeIdAtCreation: null,
    }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        dispatch={jest.fn()}
        currentTime={now()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
    expect(wrapper.html()).toContain("r2, r3")
  })

  test("shows affected routeIds if routeIdAtCreation isn't relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "diverted",
      routeIds: ["r2", "r3"],
      routeIdAtCreation: "r1",
    }
    const wrapper = mount(
      <NotificationCard
        notification={n}
        dispatch={jest.fn()}
        currentTime={now()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
    expect(wrapper.html()).toContain("r2, r3")
  })

  const reasons: NotificationReason[] = [
    "manpower",
    "disabled",
    "diverted",
    "accident",
    "other",
    "adjusted",
    "operator_error",
    "traffic",
  ]
  test.each(reasons)("renders notification with reason %s", (reason) => {
    const n: Notification = { ...notification, reason }
    mount(
      <NotificationCard
        notification={n}
        dispatch={jest.fn()}
        currentTime={now()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
  })

  test("sets and removes class to animate pop-in", () => {
    jest.useFakeTimers()
    const wrapper = mount(
      <NotificationCard
        notification={notification}
        dispatch={jest.fn()}
        currentTime={now()}
        openVPPForCurrentVehicle={jest.fn()}
      />
    )
    expect(wrapper.find(".m-notifications__card--new")).toHaveLength(1)
    act(() => {
      jest.runAllTimers()
    })
    wrapper.update()
    expect(wrapper.find(".m-notifications__card--new")).toHaveLength(0)
  })

  test("clicking through opens VPP", () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }
    mockUseReducerOnce(notificationsReducer, {
      notifications: [updatedNotification],
      showLatestNotification: true,
    })
    const mockDispatch: Dispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <NotificationsProvider>
          <Notifications />
        </NotificationsProvider>
      </StateDispatchProvider>
    )

    expect(mockDispatch).not.toHaveBeenCalled()
    wrapper.find(".m-notifications__card-info").simulate("click")
    expect(mockDispatch).toHaveBeenCalledWith(
      setNotification(updatedNotification)
    )
  })

  test("clicking through an unread notification makes it read", () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }

    const mockNotificationsDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={jest.fn}>
        <NotificationsContext.Provider
          value={{
            notifications: [updatedNotification],
            showLatestNotification: true,
            dispatch: mockNotificationsDispatch,
            rememberScrollPosition: jest.fn(),
            scrollPosition: 0,
            notificationWithOpenSubmenuId: null,
            setNotificationWithOpenSubmenuId: jest.fn(),
          }}
        >
          <Notifications />
        </NotificationsContext.Provider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-notifications__card-info").simulate("click")
    expect(mockNotificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(updatedNotification)
    )
  })
})
