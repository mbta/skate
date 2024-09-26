import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import { NotificationCard } from "../../src/components/notificationCard"
import { detourActivatedNotificationFactory } from "../factories/notification"
import routeFactory from "../factories/route"
import userEvent from "@testing-library/user-event"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { fetchDetour, fetchDetours } from "../../src/api"
import { Ok } from "../../src/util/result"
import { detourListFactory } from "../factories/detourListFactory"
import { createActor } from "xstate"
import { createDetourMachine } from "../../src/models/createDetourMachine"
import { originalRouteFactory } from "../factories/originalRouteFactory"
import { shapePointFactory } from "../factories/shapePointFactory"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"

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
      .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])

    jest.mocked(fetchDetours).mockResolvedValue(Ok(detourListFactory.build()))

    // Stub out a detour machine, and start a detour-in-progress
    const machine = createActor(createDetourMachine, {
      input: originalRouteFactory.build(),
    }).start()
    machine.send({
      type: "detour.edit.place-waypoint-on-route",
      location: shapePointFactory.build(),
    })
    machine.send({
      type: "detour.edit.place-waypoint",
      location: shapePointFactory.build(),
    })
    machine.send({
      type: "detour.edit.place-waypoint-on-route",
      location: shapePointFactory.build(),
    })
    machine.send({ type: "detour.edit.done" })

    const snapshot = machine.getPersistedSnapshot()
    machine.stop()

    // Return the state of the machine as the fetchDetour mocked value,
    // even if it doesn't match the detour clicked
    jest.mocked(fetchDetour).mockResolvedValue(
      Ok({
        updatedAt: 1726147775,
        author: "fake@email.com",
        state: snapshot,
      })
    )

    const n = detourActivatedNotificationFactory.build()

    render(
      <RoutesProvider routes={routes}>
        <NotificationCard
          notification={n}
          currentTime={new Date()}
          openVPPForCurrentVehicle={() => {}}
        />
      </RoutesProvider>
    )

    // await userEvent.click(screen.getByText(/run1/))
    await userEvent.click(screen.getByRole("button", { name: /Detour/ }))
    // Render modal based on mocked value, which is a detour-in-progress

    expect(
      screen.getByRole("heading", { name: "Share Detour Details" })
    ).toBeVisible()
  })
})
