import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import SearchPage from "../../src/components/searchPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import { Ghost, VehicleInScheduledService } from "../../src/realtime"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import stopFactory from "../factories/stop"
import userEvent from "@testing-library/user-event"
import { SearchPageState } from "../../src/state/searchPageState"
import { useStations } from "../../src/hooks/useStations"
import { LocationType } from "../../src/models/stopData"
import { zoomInButton } from "../testHelpers/selectors/components/map"
import { searchPageStateFactory } from "../factories/searchPageState"
import { mockTileUrls } from "../testHelpers/mockHelpers"
jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const vehicle: VehicleInScheduledService = vehicleFactory.build()

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

jest.mock("../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

jest.mock("../../src/tilesetUrls", () => ({
  __esModule: true,
  tilesetUrlForType: jest.fn(() => null),
}))

beforeAll(() => {
  mockTileUrls()
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

  test("Has the layers control", () => {
    ;(useSearchResults as jest.Mock).mockReturnValue([])
    render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <SearchPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(screen.getByRole("button", { name: "Layers" })).toBeInTheDocument()
  })

  test("renders vehicle data", () => {
    const searchResults: (VehicleInScheduledService | Ghost)[] = [
      vehicle,
      ghost,
    ]
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

    expect(result.container.firstChild).toHaveClass("c-search-page--show-list")
  })

  test("clicking a vehicle on the map selects it", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const searchResults: (VehicleInScheduledService | Ghost)[] = [
      { ...vehicle, runId: runId },
    ]
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

  test("clicking a search result selects that vehicle", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const searchResults: (VehicleInScheduledService | Ghost)[] = [
      { ...vehicle, runId: runId },
    ]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const activeSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "clickMe", property: "run" },
      isActive: true,
      savedQueries: [],
    })
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

    expect(result.container.firstChild).toHaveClass("c-search-page--show-map")

    await userEvent.click(
      result.getByRole("button", { name: "Show list instead" })
    )

    expect(result.container.firstChild).toHaveClass("c-search-page--show-list")
  })

  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockImplementationOnce(() => [
      stopFactory.build({ locationType: LocationType.Station }),
    ])

    const { container } = render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    await userEvent.click(zoomInButton.get())
    await userEvent.click(zoomInButton.get())

    expect(container.querySelector(".c-station-icon")).toBeVisible()
  })
})
