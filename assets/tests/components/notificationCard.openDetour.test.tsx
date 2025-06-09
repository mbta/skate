import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import { NotificationCard } from "../../src/components/notificationCard"
import { detourActivatedNotificationFactory } from "../factories/notification"
import routeFactory from "../factories/route"
import userEvent from "@testing-library/user-event"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { fetchDetour } from "../../src/api"
import { Ok } from "../../src/util/result"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"
import { detourInProgressFactory } from "../factories/detourStateMachineFactory"
import { viewDraftDetourHeading } from "../testHelpers/selectors/components/detours/diversionPage"

jest.mock("../../src/api")
jest.mock("../../src/helpers/fullStory")
jest.mock("../../src/userTestGroups")

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
  test("renders detour details modal to match mocked fetchDetour", async () => {
    jest
      .mocked(getTestGroups)
      .mockReturnValue([
        TestGroups.DetoursPilot,
        TestGroups.DetoursList,
        TestGroups.DetoursNotifications,
      ])

    jest
      .mocked(fetchDetour)
      .mockResolvedValue(Ok(detourInProgressFactory.build()))

    const n = detourActivatedNotificationFactory.build()

    render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          setNotificationRead={jest.fn()}
          setNotificationSelected={jest.fn()}
        />
      </RoutesProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: /Detour/ }))
    // Render modal based on mocked value, which is a detour-in-progress

    expect(viewDraftDetourHeading.get()).toBeVisible()
  })
})
