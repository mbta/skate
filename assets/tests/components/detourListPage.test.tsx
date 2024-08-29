import { describe, test, expect, jest } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import { DetourListPage } from "../../src/components/detourListPage"
import { useAllDetours } from "../../src/hooks/useAllDetours"

jest.useFakeTimers().setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../src/hooks/useAllDetours", () => ({
  useAllDetours: jest.fn(() => {}),
}))

describe("DetourListPage", () => {
  test("renders detour list page", () => {
    jest.mocked(useAllDetours).mockReturnValue({
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

    const tree = renderer.create(<DetourListPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
