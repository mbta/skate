import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import SearchPage from "../../src/components/searchPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import { VehicleOrGhost } from "../../src/realtime"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import stopFactory from "../factories/stop"
import userEvent from "@testing-library/user-event"
import { SearchPageState } from "../../src/state/searchPageState"
import { useStations } from "../../src/hooks/useStations"
import { LocationType } from "../../src/models/stopData"
import stateFactory from "../factories/applicationState"
jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => []),
}))

afterEach(() => {
  jest.restoreAllMocks()
})

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
    const vehicle = vehicleFactory.build()
    const ghost = ghostFactory.build()
    const searchResults: VehicleOrGhost[] = [vehicle, ghost]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const result = render(
      <StateDispatchProvider
        state={stateFactory.build({ selectedVehicleOrGhost: vehicle })}
        dispatch={jest.fn()}
      >
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

  test("clicking a search result selects that vehicle", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const runId = "clickMe"
    const searchResults = vehicleFactory.buildList(1, { runId })
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const activeSearch: SearchPageState = {
      query: { text: "clickMe", property: "run" },
      isActive: true,
      savedQueries: [],
    }
    const mockDispatch = jest.fn()
    render(
      <StateDispatchProvider
        state={{ ...initialState, searchPageState: activeSearch }}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <SearchPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: /run/i }))
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

  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockReturnValue(
      stopFactory.buildList(3, { locationType: LocationType.Station })
    )
    const { container } = render(<SearchPage />)

    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }))

    expect(container.querySelector(".m-station-icon")).toBeVisible()
  })
})
