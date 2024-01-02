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
  test("Map includes link to open vehicle in search map page", async () => {
    const mockDispatch = jest.fn()
    const mockedFSEvent = jest.mocked(fullStoryEvent)

    render(
      <MemoryRouter initialEntries={["/"]}>
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <MiniMap
            vehicle={vehicle}
            routeVehicles={[]}
            shapes={[]}
            openMapEnabled={true}
          />
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

  test("Map does not include link to open vehicle in search map page when disabled by prop", async () => {
    const mockDispatch = jest.fn()

    render(
      <MemoryRouter initialEntries={["/"]}>
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <MiniMap
            vehicle={vehicle}
            routeVehicles={[]}
            shapes={[]}
            openMapEnabled={false}
          />
        </StateDispatchProvider>
      </MemoryRouter>
    )
    expect(
      screen.queryByRole("link", { name: "Open Map" })
    ).not.toBeInTheDocument()
  })

  test("Map doesn't include fullscreen button", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MiniMap
          vehicle={vehicle}
          routeVehicles={[]}
          shapes={[]}
          openMapEnabled={true}
        />
      </MemoryRouter>
    )
    expect(
      screen.queryByRole("button", { name: "Full Screen" })
    ).not.toBeInTheDocument()
  })
})
