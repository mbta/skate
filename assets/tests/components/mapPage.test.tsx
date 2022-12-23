import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import MapPage from "../../src/components/mapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import userEvent from "@testing-library/user-event"
import { useTripShape } from "../../src/hooks/useShapes"
import { SearchPageState } from "../../src/state/searchPageState"
import useVehicleForId from "../../src/hooks/useVehicleForId"
import { useStations } from "../../src/hooks/useStations"
import { LocationType } from "../../src/models/stopData"
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

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

describe("MapPage", () => {
  test("renders the empty state", () => {
    ;(useSearchResults as jest.Mock).mockImplementationOnce(() => null)
    const { asFragment } = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(asFragment()).toMatchSnapshot()
  })

  test("renders vehicle data", () => {
    const searchResults: VehicleOrGhost[] = [vehicle, ghost]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const { asFragment } = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(asFragment()).toMatchSnapshot()
  })

  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockImplementationOnce(() => [
      {
        id: "station-1",
        name: "Station 1",
        locationType: LocationType.Station,
        lat: 42,
        lon: -71,
      },
    ])

    const { container } = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }))

    expect(container.innerHTML).toContain("m-station-icon")
  })

  test("on mobile, shows the results list initially", () => {
    const { container } = render(
      <BrowserRouter>
        <MapPage />
      </BrowserRouter>
    )

    expect(container.firstChild).toHaveClass("m-map-page--show-list")
  })

  test("clicking a vehicle on the map displays the route shape", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
      tripId === vehicle.tripId
        ? [
            {
              id: "shape",
              points: [
                { lat: 0, lon: 0 },
                { lat: 0, lon: 0 },
              ],
              stops: [
                {
                  id: "stop",
                  name: "stop",
                  lat: 0,
                  lon: 0,
                },
              ],
            },
          ]
        : null
    )

    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = [{ ...vehicle, runId: runId }]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const mockDispatch = jest.fn()
    const { container } = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(screen.queryByTestId("routeShape")).toBeNull()

    await userEvent.click(screen.getByText(runId))
    expect(container.innerHTML).toContain("m-vehicle-map__route-shape")
  })

  test("clicking a vehicle from a search result displays the route shape and card", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = [{ ...vehicle, runId: runId }]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const activeSearch: SearchPageState = {
      query: { text: "clickMe", property: "run" },
      isActive: true,
      savedQueries: [],
    }
    const mockDispatch = jest.fn()
    const { container } = render(
      <StateDispatchProvider
        state={{ ...initialState, searchPageState: activeSearch }}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("cell", { name: runId }))
    expect(container.innerHTML).toContain("m-vehicle-map__route-shape")
    expect(
      screen.getByRole("link", { name: "Go to Street View" })
    ).toBeInTheDocument()
  })

  test("submitting a new search clears the previously selected route shape", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = [{ ...vehicle, runId: runId }]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const activeSearch: SearchPageState = {
      query: { text: "clickMe", property: "run" },
      isActive: true,
      savedQueries: [],
    }
    const mockDispatch = jest.fn()
    const { container } = render(
      <StateDispatchProvider
        state={{ ...initialState, searchPageState: activeSearch }}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("cell", { name: runId }))
    expect(container.innerHTML).toContain("m-vehicle-map__route-shape")
    await userEvent.click(screen.getByTitle("Submit"))
    expect(container.innerHTML).not.toContain("m-vehicle-map__route-shape")
  })

  test("clicking a vehicle on the map displays vehicle card", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useVehicleForId as jest.Mock).mockImplementationOnce(() => vehicle)

    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = [{ ...vehicle, runId: runId }]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const mockDispatch = jest.fn()
    render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByText(runId))
    expect(screen.getByText("39_X")).toBeInTheDocument()
    expect(screen.getByText("Forest Hills")).toBeInTheDocument()
    expect(screen.getByText("Go to Street View")).toBeInTheDocument()
  })

  test("can close the vehicle card", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useVehicleForId as jest.Mock).mockImplementationOnce(() => vehicle)

    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = [{ ...vehicle, runId: runId }]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const mockDispatch = jest.fn()
    render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByText(runId))
    expect(screen.getByText("Forest Hills")).toBeInTheDocument()
    await userEvent.click(screen.getByTitle("Close"))
    expect(screen.queryByText("Forest Hills")).not.toBeInTheDocument()
  })

  test("on mobile, allows you to toggle to the map view and back again", async () => {
    const { container } = render(
      <BrowserRouter>
        <MapPage />
      </BrowserRouter>
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Show map instead" })
    )

    expect(container.firstChild).toHaveClass("m-map-page--show-map")

    await userEvent.click(
      screen.getByRole("button", { name: "Show list instead" })
    )

    expect(container.firstChild).toHaveClass("m-map-page--show-list")
  })
})
