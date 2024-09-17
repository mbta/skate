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
import getTestGroups from "../../../src/userTestGroups"

jest.spyOn(Date, "now").mockImplementation(() => 1724961600000)

jest.mock("../../../src/userTestGroups")

jest.mock("../../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())
  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
  jest.mocked(getTestGroups).mockReturnValue([])
})

describe("Detours Page: Open a Detour", () => {
  test("calls API with correct detour ID", async () => {
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
        ],
        draft: null,
        past: [
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

    render(<DetourListPage />)

    await userEvent.click(await screen.findByText("Headsign Z"))
    expect(fetchDetour).toHaveBeenCalledWith(7)
  })

  test("renders detour details modal to match mocked fetchDetour", async () => {
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
        ],
        draft: null,
        past: [
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
    jest
      .mocked(fetchDetour)
      .mockResolvedValue(
        Ok({ updatedAt: 1726147775, author: "fake@email.com", state: snapshot })
      )

    const { baseElement } = render(<DetourListPage />)

    // Click an arbitrary detour from the list
    await userEvent.click(await screen.findByText("Headsign Z"))

    // Render modal based on mocked value, which is a detour-in-progress
    expect(
      await screen.findByRole("heading", { name: "Share Detour Details" })
    ).toBeVisible()

    // Finally, check snapshot
    await waitFor(() => expect(baseElement).toMatchSnapshot())
  })
})
