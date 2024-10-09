import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import "@testing-library/jest-dom/jest-globals"
import { render, screen } from "@testing-library/react"
import { NotificationCard, title } from "../../src/components/notificationCard"
import {
  BlockWaiverReason,
  BridgeNotification,
  Notification,
} from "../../src/realtime"
import {
  blockWaiverNotificationFactory,
  bridgeLoweredNotificationFactory,
  bridgeRaisedNotificationFactory,
  detourActivatedNotificationFactory,
  detourDeactivatedNotificationFactory,
} from "../factories/notification"
import routeFactory from "../factories/route"
import userEvent from "@testing-library/user-event"
import { hideLatestNotification } from "../../src/hooks/useNotificationsReducer"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { fullStoryEvent } from "../../src/helpers/fullStory"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"
import { fetchDetour, fetchDetours } from "../../src/api"
import { Ok } from "../../src/util/result"
import { detourStateMachineFactory } from "../factories/detourStateMachineFactory"
import { detourListFactory } from "../factories/detourListFactory"

jest.mock("../../src/api")
jest.mock("../../src/helpers/fullStory")
jest.mock("../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])
  jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))
  jest
    .mocked(fetchDetour)
    .mockResolvedValue(Ok(detourStateMachineFactory.build()))
})

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
    const n: Notification = blockWaiverNotificationFactory.build({
      content: {
        reason: "operator_error",
      },
    })
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
    const n: Notification = blockWaiverNotificationFactory.build({
      content: {
        reason: "manpower",
      },
    })
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
    const n: Notification = blockWaiverNotificationFactory.build({
      content: {
        reason: "other",
      },
    })
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
    const n = blockWaiverNotificationFactory.build({
      content: {
        reason: "accident",
        routeIds: ["route2", "route3"],
        routeIdAtCreation: "route1",
      },
    })
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
    const n = blockWaiverNotificationFactory.build({
      content: {
        reason: "accident",
        routeIds: ["route2", "route3"],
        routeIdAtCreation: null,
      },
    })
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
    const n = blockWaiverNotificationFactory.build({
      content: {
        reason: "diverted",
        routeIds: ["route2", "route3"],
        routeIdAtCreation: "route1",
      },
    })
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

  const reasons: Record<BlockWaiverReason, RegExp> = {
    manpower: /No Operator/,
    disabled: /Disabled/,
    diverted: /Diversion/,
    accident: /Accident/,
    other: /Other/,
    adjusted: /Adjusted/,
    operator_error: /Operator Error/,
    traffic: /Traffic/,
  }

  test.each(Object.keys(reasons) as BlockWaiverReason[])(
    "renders block waiver notification with reason %s",
    (reason) => {
      const n = blockWaiverNotificationFactory.build({
        content: {
          reason,
        },
      })
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

  test.each<{
    notification: Notification<BridgeNotification>
    text: RegExp
  }>([
    {
      notification: bridgeLoweredNotificationFactory.build(),
      text: /Chelsea St Bridge Lowered/,
    },
    {
      notification: bridgeRaisedNotificationFactory.build(),
      text: /Chelsea St Bridge Raised/,
    },
  ])(
    "renders bridge notification with reason $status",
    ({ notification, text }) => {
      const result = render(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={notification}
            currentTime={new Date()}
            openVPPForCurrentVehicle={jest.fn()}
          />
        </RoutesProvider>
      )

      expect(result.queryByText(text)).not.toBeNull()
    }
  )

  test("clicking through opens VPP and hides notification", async () => {
    const updatedNotification = blockWaiverNotificationFactory.build({
      content: {
        runIds: ["run1"],
      },
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

    expect(openVPPForCurrentVehicle).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: "HIDE_LATEST_NOTIFICATION" })
  })

  test("renders activated detour notification if user is in DetoursList group", () => {
    const n: Notification = detourActivatedNotificationFactory.build()
    const { baseElement } = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(baseElement).toMatchSnapshot()
  })

  test("does not render activated detour notification if user not in DetoursList group", () => {
    jest.mocked(getTestGroups).mockReturnValue([])

    const n: Notification = detourActivatedNotificationFactory.build()
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.queryByText(/Detour - Active/)).toBeNull()
  })

  test("renders detour deactivated notification if user is in DetoursList group", () => {
    const n: Notification = detourDeactivatedNotificationFactory.build()
    const { baseElement } = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    // The card's role is currently just a "button" which doesn't quite feel like
    // the right role, so instead of asserting on role, this uses `getByText`
    // _for now_.
    expect(screen.getByText(/Detour - Closed/)).toBeVisible()
    expect(baseElement).toMatchSnapshot()
  })

  test("does not render deactivated detour notification if user not in DetoursList group", () => {
    jest.mocked(getTestGroups).mockReturnValue([])

    const n: Notification = detourDeactivatedNotificationFactory.build()
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.queryByText(/Detour - Closed/)).toBeNull()
  })

  test.each<{
    notification: Notification
    should_fire_fs_event: boolean
  }>([
    {
      should_fire_fs_event: true,
      notification: bridgeRaisedNotificationFactory.build(),
    },
    {
      should_fire_fs_event: true,
      notification: bridgeLoweredNotificationFactory.build(),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "other",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "manpower",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "disabled",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "diverted",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "accident",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "adjusted",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "operator_error",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "traffic",
        },
      }),
    },
    {
      should_fire_fs_event: false,
      notification: detourActivatedNotificationFactory.build({}),
    },
    {
      should_fire_fs_event: false,
      notification: detourDeactivatedNotificationFactory.build(),
    },
  ])(
    "clicking bridge notification should trigger FS event: $notification.content.reason",
    async ({ notification, should_fire_fs_event }) => {
      const mockedFSEvent = jest.mocked(fullStoryEvent)
      const updatedNotification = notification
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

      // I don't _want_ to use `title`, but there's nothing else consistent to
      // match on for _all_ notifications
      await user.click(result.getByText(title(notification)))

      if (should_fire_fs_event) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(mockedFSEvent).toHaveBeenCalledWith(
          "User clicked Chelsea Bridge Notification",
          {}
        )
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(mockedFSEvent).not.toHaveBeenCalledWith(
          "User clicked Chelsea Bridge Notification",
          {}
        )
      }
    }
  )
})
