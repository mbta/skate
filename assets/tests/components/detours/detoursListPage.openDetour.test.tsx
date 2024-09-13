import { beforeEach, describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DetourListPage } from "../../../src/components/detourListPage"
import { fetchDetour, fetchDetours } from "../../../src/api"
import { Ok } from "../../../src/util/result"
import { neverPromise } from "../../testHelpers/mockHelpers"
import { createActor } from "xstate"
import { createDetourMachine } from "../../../src/models/createDetourMachine"
import { originalRouteFactory } from "../../factories/originalRouteFactory"
import { shapePointFactory } from "../../factories/shapePointFactory"
import { TestGroups } from "../../../src/userInTestGroup"
import getTestGroups from "../../../src/userTestGroups"

jest.mock("../../../src/userTestGroups")

jest.mock("../../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())
  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
})

describe("Detours Page: Open a Detour", () => {
  test("renders detour list page", async () => {
    jest.mocked(fetchDetours).mockResolvedValue(
      Ok({
        active: [
          {
            uuid: 1,
            route: "1",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street A & Avenue B",
            updatedAt: 1724866392,
          },
          {
            uuid: 8,
            route: "2",
            direction: "Outbound",
            name: "Headsign B",
            intersection: "Street C & Avenue D",
            updatedAt: 1724856392,
          },
        ],
        draft: null,
        past: [
          {
            uuid: 10,
            route: "1",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street E & Avenue F",
            updatedAt: 1724866392,
          },
          {
            uuid: 7,
            route: "1",
            direction: "Outbound",
            name: "Headsign Z",
            intersection: "Street C & Avenue D",
            updatedAt: 1724866392,
          },
        ],
      })
    )
    // should be able to view stuff without being in test group
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

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

    jest.mocked(fetchDetour).mockResolvedValue(Ok({updatedAt: 1726147775, author: "fake@email.com", state: snapshot}))
    
    const { baseElement } = render(<DetourListPage />)

    await userEvent.click(screen.getByText("Headsign Z"))

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Share Detour Details" })
      ).toBeVisible()
    })

    await waitFor(() => expect(baseElement).toMatchSnapshot())
  })
})
