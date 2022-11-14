import React from "react"
import { render } from "@testing-library/react"
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

describe("MapPage", () => {
  test("renders the empty state", () => {
    ;(useSearchResults as jest.Mock).mockImplementationOnce(() => null)
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
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
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.asFragment()).toMatchSnapshot()
  })

  test("on mobile, shows the results list initially", () => {
    const result = render(
      <BrowserRouter>
        <MapPage />
      </BrowserRouter>
    )

    expect(result.container.firstChild).toHaveClass("m-search-page--show-list")
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
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.queryByTestId("routeShape")).toBeNull()

    await userEvent.click(result.getByText(runId))
    expect(result.getByTestId("routeShape")).toBeInTheDocument()
  })

  test("on mobile, allows you to toggle to the map view and back again", async () => {
    const result = render(
      <BrowserRouter>
        <MapPage />
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
