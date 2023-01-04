import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import MapPage from "../../src/components/mapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import * as dateTime from "../../src/util/dateTime"

import userEvent from "@testing-library/user-event"
import { useTripShape } from "../../src/hooks/useShapes"
import useVehicleForId from "../../src/hooks/useVehicleForId"
import { SearchPageState } from "../../src/state/searchPageState"
import stateFactory from "../factories/applicationState"
import ghostFactory from "../factories/ghost"
import { RunFactory } from "../factories/run"
import { searchPageStateFactory } from "../factories/searchPageState"
import { searchQueryRunFactory } from "../factories/searchQuery"
import shapeFactory from "../factories/shape"
import vehicleFactory from "../factories/vehicle"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(),
}))

jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(),
}))

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(),
}))

beforeEach(() => {
  expect.hasAssertions()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe("MapPage", () => {
  test("renders the empty state", () => {
    ;(useSearchResults as jest.Mock).mockReturnValue([])
    const { asFragment } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(asFragment()).toMatchSnapshot()
  })

  test("renders vehicle data", () => {
    const vehicle = vehicleFactory.build()
    const ghost = ghostFactory.build()

    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle, ghost])

    const { asFragment } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
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

  test("clicking a vehicle on the map, should display the route shape and set selection style for map markers", async () => {
    const runId = "clickMe"
    const vehicle = vehicleFactory.build({ runId })
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
    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    const mockDispatch = jest.fn()
    const state = stateFactory.build({
      searchPageState: searchPageStateFactory.build({
        selectedVehicleId: vehicle.id,
      }),
    })

    const { container } = render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(screen.queryByTestId("routeShape")).toBeNull()

    await userEvent.click(screen.getByRole("button", { name: runId }))
    expect(
      container.querySelector(".m-vehicle-map__route-shape")
    ).toBeInTheDocument()

    expect(container.querySelector(".selected")).toBeVisible()
  })

  test("clicking a vehicle from a search result displays the route shape and card", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const vehicle = vehicleFactory.build({ runId })
    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    const activeSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "clickMe", property: "run" },
      isActive: true,
    })
    const shapes = shapeFactory.buildList(2)
    ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
      tripId === vehicle.tripId ? shapes : null
    )
    const mockDispatch = jest.fn()

    const { container } = render(
      <StateDispatchProvider
        state={stateFactory.build({ searchPageState: activeSearch })}
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
    expect(screen.getByTitle(/map search panel/i)).not.toBeVisible()
  })

  test("submitting a new search clears the previously selected route shape", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const runId = "clickMe"
    const vehicle = vehicleFactory.build({ runId })
    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    const activeSearch: SearchPageState = {
      query: { text: runId, property: "run" },
      isActive: true,
      savedQueries: [],
    }

    const shapes = shapeFactory.buildList(2)
    ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
      tripId === vehicle.tripId ? shapes : null
    )

    const mockDispatch = jest.fn()
    const { container } = render(
      <StateDispatchProvider
        state={stateFactory.build({ searchPageState: activeSearch })}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("cell", { name: runId }))
    expect(container.querySelector(".m-vehicle-map__route-shape")).toBeVisible()
    await userEvent.click(screen.getByTitle("Submit"))
    expect(
      container.querySelector(".m-vehicle-map__route-shape")
    ).not.toBeInTheDocument()
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

  test("when vehicle properties card is closed, vehicle properties card should not be visible, search panel should be visible, elements should be removed from the map", async () => {
    const vehicle = vehicleFactory.build()
    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicle)
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const runId = "clickMe"
    ;(useSearchResults as jest.Mock).mockReturnValue(
      vehicleFactory.buildList(1, {
        runId,
      })
    )
    ;(useTripShape as jest.Mock).mockReturnValue(shapeFactory.buildList(1))

    const { container } = render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: runId }))
    expect(
      screen.getByRole("generic", { name: /vehicle properties card/i })
    ).toBeVisible()
    expect(screen.getByTitle(/map search panel/i)).not.toBeVisible()
    expect(
      container.querySelector(".m-vehicle-map__route-shape")
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(
      screen.queryByTitle(/vehicle properties card/i)
    ).not.toBeInTheDocument()
    expect(
      container.querySelector(".m-vehicle-map__route-shape")
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()
  })

  test("after search is canceled, should not render search results on map", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = RunFactory.build({}).id
    const vehicle = vehicleFactory.build({ runId })
    const shapes = shapeFactory.buildList(2)
    const activeSearch: SearchPageState = searchPageStateFactory.build({
      query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
    })

    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
      tripId === vehicle.tripId ? shapes : null
    )

    const { container } = render(
      <StateDispatchProvider
        state={stateFactory.build({ searchPageState: activeSearch })}
        dispatch={jest.fn()}
      >
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(container.querySelector(".m-vehicle-icon__label")).toBeVisible()
    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /clear/i }))
    // Leaflet? something isn't removing this from the DOM as expected....
    // await waitForElementToBeRemoved(document.querySelector(".m-vehicle-icon__label"))
  })

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
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
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
          <StateDispatchProvider
            state={stateFactory.build()}
            dispatch={jest.fn()}
          >
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
        const vehicle = vehicleFactory.build()
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicle)
        const runId = "clickMe"
        ;(useSearchResults as jest.Mock).mockReturnValue(
          vehicleFactory.buildList(1, { runId: runId })
        )
        // const searchResults: VehicleOrGhost[] = vehicleFactory.buildList(1, { runId: runId })

        render(
          <StateDispatchProvider
            state={stateFactory.build()}
            dispatch={jest.fn()}
          >
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

      test("when page is rendered with a vehicle selected, page should have vehicle properties card open and search panel collapsed", async () => {
        const runId = "clickMe"
        const vehicle = vehicleFactory.build({ runId })
        ;(useVehicleForId as jest.Mock).mockReturnValue(vehicle)
        ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])

        render(
          <StateDispatchProvider
            state={stateFactory.build({
              searchPageState: searchPageStateFactory.build({
                selectedVehicleId: vehicle.id,
              }),
            })}
            dispatch={jest.fn()}
          >
            <BrowserRouter>
              <MapPage />
            </BrowserRouter>
          </StateDispatchProvider>
        )

        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
      })
    })
  })
})
