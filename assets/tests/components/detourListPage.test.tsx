import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import React from "react"
import { DetourListPage } from "../../src/components/detourListPage"
import { fetchDetours } from "../../src/api"
import { neverPromise } from "../testHelpers/mockHelpers"
import { Ok } from "../../src/util/result"
import { render, screen } from "@testing-library/react"

jest.useFakeTimers().setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())
})

describe("DetourListPage", () => {
  test("renders detour list page", async () => {
    jest.mocked(fetchDetours).mockResolvedValue(
      Ok({
        active: [
          {
            route: "1",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street A & Avenue B",
            updated_at: 1724866392,
          },
          {
            route: "2",
            direction: "Outbound",
            name: "Headsign B",
            intersection: "Street C & Avenue D",
            updated_at: 1724856392,
          },
        ],
        draft: null,
        past: [
          {
            route: "1",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street E & Avenue F",
            updated_at: 1724866392,
          },
          {
            route: "1",
            direction: "Outbound",
            name: "Headsign Z",
            intersection: "Street C & Avenue D",
            updated_at: 1724866392,
          },
        ],
      })
    )

    const { baseElement } = render(<DetourListPage />)

    await screen.findByText("Headsign Z")

    expect(baseElement).toMatchSnapshot()
  })
})
