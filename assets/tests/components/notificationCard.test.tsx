import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import "@testing-library/jest-dom/jest-globals"
import { render, screen } from "@testing-library/react"
import { NotificationCard } from "../../src/components/notificationCard"
import {
  BlockWaiverReason,
  BridgeNotification,
  Notification,
} from "../../src/realtime"
import {
  blockWaiverNotificationFactory,
  bridgeLoweredNotificationFactory,
  bridgeRaisedNotificationFactory,
  detourActivatedNotificationContentFactory,
  detourActivatedNotificationFactory,
  detourDeactivatedNotificationFactory,
  detourExpirationNotificationFactory,
  detourExpirationWarningNotificationFactory,
} from "../factories/notification"
import routeFactory from "../factories/route"
import userEvent from "@testing-library/user-event"
import { hideLatestNotification } from "../../src/hooks/useNotificationsReducer"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { fullStoryEvent } from "../../src/helpers/fullStory"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"
import { fetchDetour } from "../../src/api"
import { Ok } from "../../src/util/result"
import { detourInProgressFactory } from "../factories/detourStateMachineFactory"

jest.mock("../../src/api")
jest.mock("../../src/helpers/fullStory")
jest.mock("../../src/userTestGroups")

beforeEach(() => {
  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursList, TestGroups.DetoursNotifications])
  jest
    .mocked(fetchDetour)
    .mockResolvedValue(Ok(detourInProgressFactory.build()))
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
            onRead={jest.fn()}
            onSelect={jest.fn()}
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
            onRead={jest.fn()}
            onSelect={jest.fn()}
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
    const onSelect = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={updatedNotification}
          currentTime={currentTime}
          onRead={jest.fn()}
          onSelect={onSelect}
          onClose={() => dispatch(hideLatestNotification())}
          noFocusOrHover={true}
        />
      </RoutesProvider>
    )
    expect(onSelect).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()

    await user.click(result.getByText(/run1/))

    expect(onSelect).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: "HIDE_LATEST_NOTIFICATION" })
  })

  test("renders activated detour notification if user is in DetoursList group", () => {
    const n: Notification = detourActivatedNotificationFactory.build({
      // Hard code values due to sequence changes for snapshot
      content: detourActivatedNotificationContentFactory.build({
        route: "2",
        headsign: "Headsign 2",
        origin: "Origin station 2",
      }),
    })
    const { baseElement } = render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
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
          onRead={jest.fn()}
          onSelect={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(result.queryByText(/Detour - Closed/)).toBeNull()
  })

  test("renders detour expiration notification if user in DetourExpirationNotifications group", () => {
    jest
      .mocked(getTestGroups)
      .mockReturnValue([TestGroups.DetourExpirationNotifications])

    const n: Notification = detourExpirationNotificationFactory.build()
    render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          onRead={jest.fn()}
          onSelect={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(screen.getByText(/Detour duration/)).toBeVisible()
  })

  test("does not render detour expiration notification if user not in DetourExpirationNotifications group", () => {
    jest.mocked(getTestGroups).mockReturnValue([])

    const n: Notification = detourExpirationNotificationFactory.build()
    render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          onRead={jest.fn()}
          onSelect={jest.fn()}
        />
      </RoutesProvider>
    )
    expect(screen.queryByText(/Detour duration/)).not.toBeInTheDocument()
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
  ])(
    "clicking bridge notification should trigger FS event: $notification.content.reason",
    async ({ notification, should_fire_fs_event }) => {
      const mockedFSEvent = jest.mocked(fullStoryEvent)
      const updatedNotification = notification
      const dispatch = jest.fn()
      const currentTime = new Date()
      const onSelect = jest.fn()

      const user = userEvent.setup()
      const result = render(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={updatedNotification}
            currentTime={currentTime}
            onRead={jest.fn()}
            onSelect={onSelect}
            onClose={() => dispatch(hideLatestNotification())}
            noFocusOrHover={true}
          />
        </RoutesProvider>
      )
      expect(onSelect).not.toHaveBeenCalled()
      expect(dispatch).not.toHaveBeenCalled()

      await user.click(result.getByText(/Chelsea St Bridge/))

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

  test.each<{
    notification: Notification
    text: RegExp
    mocks?: () => void
  }>([
    {
      notification: blockWaiverNotificationFactory.build({
        content: {
          reason: "manpower",
        },
      }),
      text: /No Operator/,
    },
    {
      notification: detourActivatedNotificationFactory.build({}),
      text: /Detour - Active/,
    },
    {
      notification: detourDeactivatedNotificationFactory.build(),
      text: /Detour - Closed/,
    },
    {
      notification: detourExpirationNotificationFactory.build(),
      text: /Detour duration/,
      mocks: () =>
        jest
          .mocked(getTestGroups)
          .mockReturnValue([TestGroups.DetourExpirationNotifications]),
    },
    {
      notification: detourExpirationWarningNotificationFactory.build(),
      text: /Detour duration/,
      mocks: () =>
        jest
          .mocked(getTestGroups)
          .mockReturnValue([TestGroups.DetourExpirationNotifications]),
    },
    {
      notification: bridgeRaisedNotificationFactory.build(),
      text: /Chelsea St Bridge Raised/,
    },
    {
      notification: bridgeLoweredNotificationFactory.build(),
      text: /Chelsea St Bridge Lowered/,
    },
  ])(
    "clicking $text notification should call onRead",
    async ({ notification, text, mocks }) => {
      if (mocks) {
        mocks()
      }

      const currentTime = new Date()
      const onRead = jest.fn()

      const user = userEvent.setup()
      const result = render(
        <RoutesProvider routes={routes}>
          <NotificationCard
            notification={notification}
            currentTime={currentTime}
            onRead={onRead}
            onSelect={jest.fn()}
            onClose={jest.fn()}
            noFocusOrHover={true}
          />
        </RoutesProvider>
      )
      expect(onRead).not.toHaveBeenCalled()

      await user.click(result.getByText(text))

      expect(onRead).toHaveBeenCalled()
    }
  )
})
