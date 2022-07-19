import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import { Notifications } from "../../src/components/notifications"
import { NotificationsContext } from "../../src/contexts/notificationsContext"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  hideLatestNotification,
  toggleReadState,
} from "../../src/hooks/useNotificationsReducer"
import { Notification } from "../../src/realtime.d"
import { Route } from "../../src/schedule"
import { initialState } from "../../src/state"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

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

  test("can hide notification", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
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

    await user.click(result.getByTitle("Close"))
    expect(dispatch).toHaveBeenCalledWith(hideLatestNotification())
  })

  test("clicking through an unread notification makes it read", async () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }

    const mockNotificationsDispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
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

    await user.click(result.getByText(/No Operator/))

    expect(mockNotificationsDispatch).toHaveBeenCalledWith(
      toggleReadState(updatedNotification)
    )
  })
})
