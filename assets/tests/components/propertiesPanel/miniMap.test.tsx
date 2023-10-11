import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals"
import React from "react"
import { VehicleInScheduledService } from "../../../src/realtime"
import vehicleFactory from "../../factories/vehicle"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import MiniMap from "../../../src/components/propertiesPanel/miniMap"
import "@testing-library/jest-dom/jest-globals"
import { MemoryRouter } from "react-router"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState } from "../../../src/state"
import {
  SelectedEntityType,
  newSearchSession,
} from "../../../src/state/searchPageState"
import userEvent from "@testing-library/user-event"
import { mockTileUrls } from "../../testHelpers/mockHelpers"
import { layersControlButton } from "../../testHelpers/selectors/components/map"
import { fullStoryEvent } from "../../../src/helpers/fullStory"

const vehicle: VehicleInScheduledService = vehicleFactory.build()

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

jest.mock("../../../src/tilesetUrls", () => ({
  __esModule: true,
  tilesetUrlForType: jest.fn(() => null),
}))

jest.mock("../../../src/helpers/fullStory")

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

beforeAll(() => {
  mockTileUrls()
})

afterAll(() => {
  global.scrollTo = originalScrollTo
})

describe("MiniMap", () => {
  describe("For users in map test group", () => {
    beforeAll(() => {
      ;(getTestGroups as jest.Mock).mockReturnValue([TestGroups.MapBeta])
    })
    test("Map includes link to open vehicle in search map page", async () => {
      const mockDispatch = jest.fn()
      const mockedFSEvent = jest.mocked(fullStoryEvent)

      render(
        <MemoryRouter initialEntries={["/"]}>
          <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
            <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />
          </StateDispatchProvider>
        </MemoryRouter>
      )
      expect(screen.getByRole("link", { name: "Open Map" })).toBeInTheDocument()
      await userEvent.click(screen.getByRole("link", { name: "Open Map" }))
      expect(mockDispatch).toHaveBeenCalledWith(
        newSearchSession({
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        })
      )
      expect(mockedFSEvent).toHaveBeenCalledWith(
        "Map opened from VPP mini map",
        {}
      )
    })

    test("Map doesn't include fullscreen button", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />
        </MemoryRouter>
      )
      expect(
        screen.queryByRole("button", { name: "Full Screen" })
      ).not.toBeInTheDocument()
    })
  })

  describe("For users not in map test group", () => {
    beforeAll(() => {
      ;(getTestGroups as jest.Mock).mockReturnValue([])
    })
    test("Map does not include link to open vehicle in search map page", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />
        </MemoryRouter>
      )
      expect(
        screen.queryByRole("link", { name: "Open Map" })
      ).not.toBeInTheDocument()
    })

    test("Map does include fullscreen button", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />
        </MemoryRouter>
      )
      expect(
        screen.getByRole("button", { name: "Full Screen" })
      ).toBeInTheDocument()
    })

    test("Doesn't have layers control", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />
        </MemoryRouter>
      )
      expect(layersControlButton.query()).toBeNull()
    })
  })
})
