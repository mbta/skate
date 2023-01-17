import React from "react"
import { Vehicle } from "../../../src/realtime"
import vehicleFactory from "../../factories/vehicle"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import getTestGroups from "../../../src/userTestGroups"
import { MAP_BETA_GROUP_NAME } from "../../../src/userInTestGroup"
import MiniMap from "../../../src/components/propertiesPanel/miniMap"
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState } from "../../../src/state"
import { setSelectedVehicle } from "../../../src/state/searchPageState"
import userEvent from "@testing-library/user-event"

const vehicle: Vehicle = vehicleFactory.build()

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

afterAll(() => {
  global.scrollTo = originalScrollTo
})

describe("MiniMap", () => {
  describe("For users in map test group", () => {
    beforeAll(() => {
      ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])
    })
    test("Map includes link to open vehicle in search map page", async () => {
      const mockDispatch = jest.fn()

      render(
        <MemoryRouter initialEntries={["/"]}>
          <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
            <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />
          </StateDispatchProvider>
        </MemoryRouter>
      )
      expect(screen.getByText("Open Map")).toBeInTheDocument()
      await userEvent.click(screen.getByText("Open Map"))
      expect(mockDispatch).toHaveBeenCalledWith(setSelectedVehicle(vehicle.id))
    })

    test("Map doesn't include fullscreen button", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />{" "}
        </MemoryRouter>
      )
      expect(screen.queryByTitle("Full Screen")).not.toBeInTheDocument()
    })
  })

  describe("For users not in map test group", () => {
    beforeAll(() => {
      ;(getTestGroups as jest.Mock).mockReturnValue([])
    })
    test("Map does not include link to open vehicle in search map page", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />{" "}
        </MemoryRouter>
      )
      expect(screen.queryByText("Open Map")).not.toBeInTheDocument()
    })

    test("Map does include fullscreen button", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <MiniMap vehicle={vehicle} routeVehicles={[]} shapes={[]} />{" "}
        </MemoryRouter>
      )
      expect(screen.getByTitle("Full Screen")).toBeInTheDocument()
    })
  })
})
