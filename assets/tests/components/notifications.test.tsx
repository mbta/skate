import { mount } from "enzyme"
import React from "react"
import { act } from "react-dom/test-utils"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import {
  NotificationCard,
  Notifications,
} from "../../src/components/notifications"
import { NotificationsContext } from "../../src/contexts/notificationsContext"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  hideLatestNotification,
  toggleReadState,
} from "../../src/hooks/useNotificationsReducer"
import { Notification, NotificationReason } from "../../src/realtime.d"
import { Route } from "../../src/schedule"
import { initialState } from "../../src/state"

jest.mock("../../src/hooks/useNotifications", () => ({
  __esModule: true,
  useNotifications: jest.fn(),
}))

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

const baselineTime = new Date(123_456_789)

const notification: Notification = {
  id: "0",
  createdAt: new Date(baselineTime),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: baselineTime,
  endTime: baselineTime,
  state: "unread",
}

const notificationWithMatchedVehicle: Notification = {
  ...notification,
  operatorName: "operatorName",
  operatorId: "operatorId",
  routeIdAtCreation: "route1",
}

const routes: Route[] = [
  routeFactory.build({
    id: "route1",
    name: "r1",
  }),
  routeFactory.build({
    id: "route2",
    name: "r2",
  }),
  routeFactory.build({
    id: "route3",
    name: "r3",
  }),
]

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
        <RoutesProvider routes={routes}>
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
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("logs to Fullstory when delivering a bridge-lowered notification", () => {
    const eventFn = jest.fn()
    window.FS = { event: eventFn, identify: jest.fn() }

    const notifications: Notification[] = [
      {
        ...notification,
        reason: "chelsea_st_bridge_lowered" as NotificationReason,
      },
    ]

    mount(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
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
      </StateDispatchProvider>
    )

    expect(eventFn).toHaveBeenCalledWith(
      "Chelsea bridge notification delivered"
    )
  })

  test("logs to Fullstory when delivering a bridge-raised notification", () => {
    const eventFn = jest.fn()
    window.FS = { event: eventFn, identify: jest.fn() }

    const notifications: Notification[] = [
      {
        ...notification,
        reason: "chelsea_st_bridge_raised" as NotificationReason,
      },
    ]

    mount(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
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
      </StateDispatchProvider>
    )

    expect(eventFn).toHaveBeenCalledWith(
      "Chelsea bridge notification delivered"
    )
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
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={notificationWithMatchedVehicle}
            currentTime={baselineTime}
            dispatch={jest.fn()}
            openVPPForCurrentVehicle={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("transforms reasons into human-readable titles", () => {
    const n: Notification = { ...notification, reason: "operator_error" }
    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={baselineTime}
          dispatch={jest.fn()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(wrapper.html()).toContain("Operator Error")
  })

  test("uses custom titles if available", () => {
    const n: Notification = { ...notification, reason: "manpower" }
    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          dispatch={jest.fn()}
          currentTime={baselineTime}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(wrapper.html()).toContain("No Operator")
  })

  test("renders a notification with an unexpected reason", () => {
    const n: Notification = { ...notification, reason: "other" }
    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={n}
            dispatch={jest.fn()}
            currentTime={baselineTime}
            openVPPForCurrentVehicle={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("routeIdAtCreation shows when relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "accident",
      routeIds: ["route2", "route3"],
      routeIdAtCreation: "route1",
    }
    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          dispatch={jest.fn()}
          currentTime={baselineTime}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(wrapper.html()).toContain("r1")
  })

  test("falls back to affected routeIds if routeIdAtCreation is missing", () => {
    const n: Notification = {
      ...notification,
      reason: "accident",
      routeIds: ["route2", "route3"],
      routeIdAtCreation: null,
    }
    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          dispatch={jest.fn()}
          currentTime={baselineTime}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(wrapper.html()).toContain("r2, r3")
  })

  test("shows affected routeIds if routeIdAtCreation isn't relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "diverted",
      routeIds: ["route2", "route3"],
      routeIdAtCreation: "route1",
    }
    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          dispatch={jest.fn()}
          currentTime={baselineTime}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
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
    "chelsea_st_bridge_raised",
    "chelsea_st_bridge_lowered",
  ]

  test.each(reasons)("renders notification with reason %s", (reason) => {
    const runIds =
      reason === "chelsea_st_bridge_raised" ||
      reason === "chelsea_st_bridge_lowered"
        ? []
        : notification.runIds

    const n: Notification = { ...notification, reason, runIds }
    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={n}
            dispatch={jest.fn()}
            currentTime={baselineTime}
            openVPPForCurrentVehicle={jest.fn()}
          />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("sets and removes class to animate pop-in", () => {
    jest.useFakeTimers()
    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={notification}
          dispatch={jest.fn()}
          currentTime={baselineTime}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(wrapper.find(".m-notifications__card--new")).toHaveLength(1)
    act(() => {
      jest.runAllTimers()
    })
    wrapper.update()
    expect(wrapper.find(".m-notifications__card--new")).toHaveLength(0)
  })

  test("clicking through opens VPP and hides notification", () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }
    const dispatch = jest.fn()
    const currentTime = new Date()
    const openVPPForCurrentVehicle = jest.fn()

    const wrapper = mount(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={updatedNotification}
          dispatch={dispatch}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
        />
      </RoutesProvider>
    )
    expect(openVPPForCurrentVehicle).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    wrapper.find(".m-notifications__card-info").simulate("click")
    expect(openVPPForCurrentVehicle).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: "HIDE_LATEST_NOTIFICATION" })
  })

  test("clicking through an unread notification makes it read", () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }

    const mockNotificationsDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={jest.fn}>
        <RoutesProvider routes={routes}>
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
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-notifications__card-info").simulate("click")
    expect(mockNotificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(updatedNotification)
    )
  })

  test("clicking a bridge-lowered notification logs to Fullstory", () => {
    const eventFn = jest.fn()
    window.FS = { event: eventFn, identify: jest.fn() }

    const loweringNotification = {
      ...notification,
      reason: "chelsea_st_bridge_lowered" as NotificationReason,
    }

    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <NotificationsContext.Provider
          value={{
            notifications: [loweringNotification],
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
      </StateDispatchProvider>
    )

    wrapper.find(".m-notifications__card-info").first().simulate("click")
    expect(eventFn).toHaveBeenCalledWith("Chelsea bridge notification clicked")
  })

  test("clicking a bridge-raised notification logs to Fullstory", () => {
    const eventFn = jest.fn()
    window.FS = { event: eventFn, identify: jest.fn() }

    const raisedNotification = {
      ...notification,
      reason: "chelsea_st_bridge_raised" as NotificationReason,
    }

    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <NotificationsContext.Provider
          value={{
            notifications: [raisedNotification],
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
      </StateDispatchProvider>
    )

    wrapper.find(".m-notifications__card-info").first().simulate("click")
    expect(eventFn).toHaveBeenCalledWith("Chelsea bridge notification clicked")
  })
})
