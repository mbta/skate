import React from "react"
import { render } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import SearchPage from "../../src/components/searchPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import userEvent from "@testing-library/user-event"
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

describe("SearchPage", () => {
  test("renders the empty state", () => {
    ;(useSearchResults as jest.Mock).mockImplementationOnce(() => null)
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <SearchPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders vehicle data", () => {
    const searchResults: VehicleOrGhost[] = [vehicle, ghost]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <SearchPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.asFragment()).toMatchSnapshot()
  })

  test("on mobile, shows the results list initially", () => {
    const result = render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    expect(result.container.firstChild).toHaveClass("m-search-page--show-list")
  })

  test("clicking a vehicle on the map selects it", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = [{ ...vehicle, runId: runId }]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const mockDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <BrowserRouter>
          <SearchPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText(runId))
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SELECT_VEHICLE" })
    )
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
