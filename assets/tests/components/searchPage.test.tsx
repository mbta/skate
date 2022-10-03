import React from "react"
import renderer from "react-test-renderer"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import SearchPage from "../../src/components/searchPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime"
import { initialState, State } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import useVehicleForId from "../../src/hooks/useVehicleForId"
jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const vehicle: Vehicle = vehicleFactory.build()

const ghost: Ghost = ghostFactory.build({
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: "123-0123",
  viaVariant: "X",
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  scheduledLogonTime: null,
  routeStatus: "on_route",
  blockWaivers: [],
})
jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mocks needed for VPP
jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => []),
}))

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => []),
}))

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe("SearchPage", () => {
  test("renders the empty state", () => {
    ;(useSearchResults as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
          <BrowserRouter>
            <SearchPage />
          </BrowserRouter>
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders vehicle data", () => {
    const searchResults: VehicleOrGhost[] = [vehicle, ghost]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
          <BrowserRouter>
            <SearchPage />
          </BrowserRouter>
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("on mobile, shows the results list initially", () => {
    const result = render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    expect(result.container.firstChild).toHaveClass("m-search-page--show-list")
  })

  test("renders a selected vehicle", () => {
    const selectedVehicleState: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
    }
    ;(useVehicleForId as jest.Mock).mockImplementation(() => vehicle)

    const result = render(
      <StateDispatchProvider state={selectedVehicleState} dispatch={jest.fn()}>
        <BrowserRouter>
          <SearchPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("on mobile, allows you to toggle to the map view and back again", async () => {
    const result = render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    await userEvent.click(
      result.getByRole("button", { name: "Show map instead" })
    )

    expect(result.container.firstChild).toHaveClass("m-search-page--show-map")

    await userEvent.click(
      result.getByRole("button", { name: "Show list instead" })
    )

    expect(result.container.firstChild).toHaveClass("m-search-page--show-list")
  })
})
