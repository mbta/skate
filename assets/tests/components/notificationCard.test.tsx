import React from "react"
import { render } from "@testing-library/react"
import { NotificationCard } from "../../src/components/notificationCard"
import { Notification, NotificationReason } from "../../src/realtime"
import notificationFactory from "../factories/notification"
import routeFactory from "../factories/route"
import userEvent from "@testing-library/user-event"
import { hideLatestNotification } from "../../src/hooks/useNotificationsReducer"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"

const notification = notificationFactory.build({
  routeIds: ["route1", "route2"],
  routeIdAtCreation: null,
})

const notificationWithMatchedVehicle: Notification = {
  ...notification,
  operatorName: "operatorName",
  operatorId: "operatorId",
  routeIdAtCreation: "route1",
}

const routes = [
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

describe("NotificationCard", () => {
  test("transforms reasons into human-readable titles", () => {
    const n: Notification = { ...notification, reason: "operator_error" }
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.queryByText(/Operator Error/)).not.toBeNull()
  })

  test("uses custom titles if available", () => {
    const n: Notification = { ...notification, reason: "manpower" }
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.queryByText(/No Operator/)).not.toBeNull()
  })

  test("renders a notification with an unexpected reason", () => {
    const n: Notification = { ...notification, reason: "other" }
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )

    expect(result.getByText(/Other/)).not.toBeNull()
  })

  test("routeIdAtCreation shows when relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "accident",
      routeIds: ["route2", "route3"],
      routeIdAtCreation: "route1",
    }
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.getByText(/r1/)).not.toBeNull()
  })

  test("falls back to affected routeIds if routeIdAtCreation is missing", () => {
    const n: Notification = {
      ...notification,
      reason: "accident",
      routeIds: ["route2", "route3"],
      routeIdAtCreation: null,
    }
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.getByText(/r2, r3/)).not.toBeNull()
  })

  test("shows affected routeIds if routeIdAtCreation isn't relevant", () => {
    const n: Notification = {
      ...notificationWithMatchedVehicle,
      reason: "diverted",
      routeIds: ["route2", "route3"],
      routeIdAtCreation: "route1",
    }
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.getByText(/r2, r3/)).not.toBeNull()
  })

  const reasons: Record<NotificationReason, RegExp> = {
    manpower: /No Operator/,
    disabled: /Disabled/,
    diverted: /Diversion/,
    accident: /Accident/,
    other: /Other/,
    adjusted: /Adjusted/,
    operator_error: /Operator Error/,
    traffic: /Traffic/,
    chelsea_st_bridge_raised: /Chelsea St Bridge Raised/,
    chelsea_st_bridge_lowered: /Chelsea St Bridge Lowered/,
  }

  test.each(Object.keys(reasons) as NotificationReason[])(
    "renders notification with reason %s",
    (reason) => {
      const runIds =
        reason === "chelsea_st_bridge_raised" ||
        reason === "chelsea_st_bridge_lowered"
          ? []
          : notification.runIds

      const n: Notification = { ...notification, reason, runIds }
      const result = render(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={n}
            currentTime={new Date()}
            openVPPForCurrentVehicle={jest.fn()}
          />
        </RoutesProvider>
      )

      expect(result.queryByText(reasons[reason])).not.toBeNull()
    }
  )

  test("clicking through opens VPP and hides notification", async () => {
    const updatedNotification = {
      ...notification,
      tripIds: ["123", "456", "789"],
    }
    const dispatch = jest.fn()
    const currentTime = new Date()
    const openVPPForCurrentVehicle = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={updatedNotification}
          currentTime={currentTime}
          openVPPForCurrentVehicle={openVPPForCurrentVehicle}
          hideLatestNotification={() => dispatch(hideLatestNotification())}
          noFocusOrHover={true}
        />
      </RoutesProvider>
    )
    expect(openVPPForCurrentVehicle).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()

    await user.click(result.getByText(/run1/))

    expect(openVPPForCurrentVehicle).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: "HIDE_LATEST_NOTIFICATION" })
  })

  test.each<{
    reason: NotificationReason
    should_fire_fs_event: boolean
  }>([
    { should_fire_fs_event: true, reason: "chelsea_st_bridge_raised" },
    { should_fire_fs_event: true, reason: "chelsea_st_bridge_lowered" },
    { should_fire_fs_event: false, reason: "other" },
    { should_fire_fs_event: false, reason: "manpower" },
    { should_fire_fs_event: false, reason: "disabled" },
    { should_fire_fs_event: false, reason: "diverted" },
    { should_fire_fs_event: false, reason: "accident" },
    { should_fire_fs_event: false, reason: "adjusted" },
    { should_fire_fs_event: false, reason: "operator_error" },
    { should_fire_fs_event: false, reason: "traffic" },
  ])(
    "clicking bridge notification should trigger FS event: %s",
    async ({ reason, should_fire_fs_event }) => {
      mockFullStoryEvent()
      const updatedNotification = notificationFactory.build({
        reason,
      })
      const dispatch = jest.fn()
      const currentTime = new Date()
      const openVPPForCurrentVehicle = jest.fn()

      const user = userEvent.setup()
      const result = render(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={updatedNotification}
            currentTime={currentTime}
            openVPPForCurrentVehicle={openVPPForCurrentVehicle}
            hideLatestNotification={() => dispatch(hideLatestNotification())}
            noFocusOrHover={true}
          />
        </RoutesProvider>
      )
      expect(openVPPForCurrentVehicle).not.toHaveBeenCalled()
      expect(dispatch).not.toHaveBeenCalled()

      await user.click(result.getByText(/run1/))

      if (should_fire_fs_event) {
        expect(window.FS!.event).toHaveBeenCalledWith(
          "User clicked Chelsea Bridge Notification"
        )
      } else {
        expect(window.FS!.event).not.toHaveBeenCalledWith(
          "User clicked Chelsea Bridge Notification"
        )
      }
    }
  )
})
