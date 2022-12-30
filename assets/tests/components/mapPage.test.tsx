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
    expect(
      container.querySelector(".m-vehicle-map__route-shape")
    ).toBeInTheDocument()
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
    expect(
      screen.getByRole("generic", { name: /vehicle properties card/i })
    ).toBeVisible()
    expect(container.querySelector(".m-vehicle-map__route-shape")).toBeVisible()
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

  test("vehicle card fires `onClose`, vehicle properties card should not be visible, search panel should be visible", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useVehicleForId as jest.Mock).mockImplementationOnce(() => vehicle)

    const runId = "clickMe"
    const searchResults: VehicleOrGhost[] = vehicleFactory.buildList(1, {
      runId,
    })
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)

    render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: runId }))
    expect(
      screen.getByRole("generic", { name: /vehicle properties card/i })
    ).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(
      screen.queryByRole("generic", { name: /vehicle properties card/i })
    ).not.toBeInTheDocument() // toBeVisible() is also acceptable

    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()
  })

  test("after search is canceled, should not render search results", () => {
    expect.hasAssertions()
  })

  test.todo(
    "closing the vehicle properties card, should remove related elements from the map"
  )

  test("When a vehicle is selected, the search panel should be collapsed", async () => {
    expect.hasAssertions()
    const runId = "clickMe"
    const vehicle = vehicleFactory.build({ runId })
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicle)
    ;(useSearchResults as jest.Mock).mockReturnValue(
      vehicleFactory.buildList(1, { runId: runId })
    )

    render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    const mapSearchPanel = screen.getByRole("generic", {
      name: /map search panel/i,
    })
    expect(mapSearchPanel).toBeVisible()

    await userEvent.click(
      screen.getByRole("button", {
        name: runId,
      })
    )

    expect(
      screen.getByRole("generic", { name: /vehicle properties card/i })
    ).toBeVisible()
    expect(mapSearchPanel).not.toBeVisible()
  })

  test.todo(
    "Closing the card causes the search panel to be in its expanded state."
  )

  describe("VehiclePropertiesCard", () => {
    describe("renders", () => {
      test("after search result is selected", async () => {
        const runId = "clickMe"
        const vehicle = vehicleFactory.build({ runId })
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicle)
        ;(useSearchResults as jest.Mock).mockReturnValue(
          vehicleFactory.buildList(1, { runId: runId })
        )

        render(
          <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
            <BrowserRouter>
              <MapPage />
            </BrowserRouter>
          </StateDispatchProvider>
        )

        await userEvent.click(
          screen.getByRole("button", {
            name: runId,
          })
        )
        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
      })

      test("after vehicle on the map is clicked", async () => {
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicle)
        const runId = "clickMe"
        ;(useSearchResults as jest.Mock).mockReturnValue(
          vehicleFactory.buildList(1, { runId: runId })
        )
        // const searchResults: VehicleOrGhost[] = vehicleFactory.buildList(1, { runId: runId })

        render(
          <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
            <BrowserRouter>
              <MapPage />
            </BrowserRouter>
          </StateDispatchProvider>
        )

        await userEvent.click(
          screen.getByRole("button", {
            name: runId,
          })
        )
        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
      })

      test("VPC is opened when page is loaded with vehicle selected, search panel is closed if state is last selected and not closed", async () => {
        // jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        const vehicle = vehicleFactory.build()
        ;(useVehicleForId as jest.Mock).mockReturnValue(vehicle)
        const runId = "clickMe"
        ;(useSearchResults as jest.Mock).mockReturnValue(
          vehicleFactory.buildList(1, { runId: runId })
        )
        // const searchResults: VehicleOrGhost[] = vehicleFactory.buildList(1, { runId: runId })

        render(
          <StateDispatchProvider
            state={{
              ...initialState,
              searchPageState: {
                ...initialState.searchPageState,
                selectedVehicleId: vehicle.id,
              },
            }}
            dispatch={jest.fn()}
          >
            <BrowserRouter>
              <MapPage />
            </BrowserRouter>
          </StateDispatchProvider>
        )

        // expect(screen.getByTitle(/vehicle properties card/i)).toBeVisible()
        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
      })
    })
  })

  test.todo("selected vehicle is styled as selected")
})
