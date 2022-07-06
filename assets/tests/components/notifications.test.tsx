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

/* const notificationWithMatchedVehicle: Notification = {
 *   ...notification,
 *   operatorName: "operatorName",
 *   operatorId: "operatorId",
 *   routeIdAtCreation: "route1",
 * } */

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

  /* test("renders notification with matched vehicle", () => {
   *   const tree = renderer
   *     .create(
   *       <RoutesProvider routes={routes}>
   *         <NotificationCard
   *           notification={notificationWithMatchedVehicle}
   *           currentTime={baselineTime}
   *           dispatch={jest.fn()}
   *           openVPPForCurrentVehicle={jest.fn()}
   *         />
   *       </RoutesProvider>
   *     )
   *     .toJSON()
   *   expect(tree).toMatchSnapshot()
   * }) */

  /* test("transforms reasons into human-readable titles", () => {
   *   const n: Notification = { ...notification, reason: "operator_error" }
   *   const wrapper = mount(
   *     <RoutesProvider routes={routes}>
   *       <NotificationCard
   *         notification={n}
   *         currentTime={baselineTime}
   *         dispatch={jest.fn()}
   *         openVPPForCurrentVehicle={jest.fn()}
   *       />
   *     </RoutesProvider>
   *   )
   *   expect(wrapper.html()).toContain("Operator Error")
   * }) */

  /* test("uses custom titles if available", () => {
   *   const n: Notification = { ...notification, reason: "manpower" }
   *   const wrapper = mount(
   *     <RoutesProvider routes={routes}>
   *       <NotificationCard
   *         notification={n}
   *         dispatch={jest.fn()}
   *         currentTime={baselineTime}
   *         openVPPForCurrentVehicle={jest.fn()}
   *       />
   *     </RoutesProvider>
   *   )
   *   expect(wrapper.html()).toContain("No Operator")
   * }) */

  /* test("renders a notification with an unexpected reason", () => {
   *   const n: Notification = { ...notification, reason: "other" }
   *   const tree = renderer
   *     .create(
   *       <RoutesProvider routes={routes}>
   *         <NotificationCard
   *           notification={n}
   *           dispatch={jest.fn()}
   *           currentTime={baselineTime}
   *           openVPPForCurrentVehicle={jest.fn()}
   *         />
   *       </RoutesProvider>
   *     )
   *     .toJSON()
   *   expect(tree).toMatchSnapshot()
   * }) */

  /* test("routeIdAtCreation shows when relevant", () => {
   *   const n: Notification = {
   *     ...notificationWithMatchedVehicle,
   *     reason: "accident",
   *     routeIds: ["route2", "route3"],
   *     routeIdAtCreation: "route1",
   *   }
   *   const wrapper = mount(
   *     <RoutesProvider routes={routes}>
   *       <NotificationCard
   *         notification={n}
   *         dispatch={jest.fn()}
   *         currentTime={baselineTime}
   *         openVPPForCurrentVehicle={jest.fn()}
   *       />
   *     </RoutesProvider>
   *   )
   *   expect(wrapper.html()).toContain("r1")
   * }) */

  /* test("falls back to affected routeIds if routeIdAtCreation is missing", () => {
   *   const n: Notification = {
   *     ...notification,
   *     reason: "accident",
   *     routeIds: ["route2", "route3"],
   *     routeIdAtCreation: null,
   *   }
   *   const wrapper = mount(
   *     <RoutesProvider routes={routes}>
   *       <NotificationCard
   *         notification={n}
   *         dispatch={jest.fn()}
   *         currentTime={baselineTime}
   *         openVPPForCurrentVehicle={jest.fn()}
   *       />
   *     </RoutesProvider>
   *   )
   *   expect(wrapper.html()).toContain("r2, r3")
   * }) */

  /* test("shows affected routeIds if routeIdAtCreation isn't relevant", () => {
   *   const n: Notification = {
   *     ...notificationWithMatchedVehicle,
   *     reason: "diverted",
   *     routeIds: ["route2", "route3"],
   *     routeIdAtCreation: "route1",
   *   }
   *   const wrapper = mount(
   *     <RoutesProvider routes={routes}>
   *       <NotificationCard
   *         notification={n}
   *         dispatch={jest.fn()}
   *         currentTime={baselineTime}
   *         openVPPForCurrentVehicle={jest.fn()}
   *       />
   *     </RoutesProvider>
   *   )
   *   expect(wrapper.html()).toContain("r2, r3")
   * }) */

  /* const reasons: NotificationReason[] = [
     *   "manpower",
     *   "disabled",
     *   "diverted",
     *   "accident",
     *   "other",
     *   "adjusted",
     *   "operator_error",
     *   "traffic",
     *   "chelsea_st_bridge_raised",
     *   "chelsea_st_bridge_lowered",
     * ]

     * test.each(reasons)("renders notification with reason %s", (reason) => {
     *   const runIds =
     *     reason === "chelsea_st_bridge_raised" ||
     *     reason === "chelsea_st_bridge_lowered"
     *       ? []
     *       : notification.runIds

     *   const n: Notification = { ...notification, reason, runIds }
     *   const tree = renderer
     *     .create(
     *       <RoutesProvider routes={routes}>
     *         <NotificationCard
     *           notification={n}
     *           dispatch={jest.fn()}
     *           currentTime={baselineTime}
     *           openVPPForCurrentVehicle={jest.fn()}
     *         />
     *       </RoutesProvider>
     *     )
     *     .toJSON()
     *   expect(tree).toMatchSnapshot()
     * })
     */
  /* test("sets and removes class to animate pop-in", () => {
   *   jest.useFakeTimers()
   *   const wrapper = mount(
   *     <RoutesProvider routes={routes}>
   *       <NotificationCard
   *         notification={notification}
   *         dispatch={jest.fn()}
   *         currentTime={baselineTime}
   *         openVPPForCurrentVehicle={jest.fn()}
   *       />
   *     </RoutesProvider>
   *   )
   *   expect(wrapper.find(".m-notifications__card--new")).toHaveLength(1)
   *   act(() => {
   *     jest.runAllTimers()
   *   })
   *   wrapper.update()
   *   expect(wrapper.find(".m-notifications__card--new")).toHaveLength(0)
   * }) */

  /* test("clicking through opens VPP and hides notification", () => {
     *   const updatedNotification = {
     *     ...notification,
     *     tripIds: ["123", "456", "789"],
     *   }
     *   const dispatch = jest.fn()
     *   const currentTime = new Date()
     *   const openVPPForCurrentVehicle = jest.fn()

     *   const wrapper = mount(
     *     <RoutesProvider routes={routes}>
     *       <NotificationCard
     *         notification={updatedNotification}
     *         dispatch={dispatch}
     *         currentTime={currentTime}
     *         openVPPForCurrentVehicle={openVPPForCurrentVehicle}
     *       />
     *     </RoutesProvider>
     *   )
     *   expect(openVPPForCurrentVehicle).not.toHaveBeenCalled()
     *   expect(dispatch).not.toHaveBeenCalled()
     *   wrapper.find(".m-notifications__card-info").simulate("click")
     *   expect(openVPPForCurrentVehicle).toHaveBeenCalled()
     *   expect(dispatch).toHaveBeenCalledWith({ type: "HIDE_LATEST_NOTIFICATION" })
     * }) */

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
