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
import { useStations } from "../../src/hooks/useStations"
import { LocationType } from "../../src/models/stopData"
import { SearchPageState } from "../../src/state/searchPageState"
import stateFactory from "../factories/applicationState"
import ghostFactory from "../factories/ghost"
import { RunFactory } from "../factories/run"
import { activeSearchPageStateFactory, searchPageStateFactory } from "../factories/searchPageState"
import { searchQueryRunFactory } from "../factories/searchQuery"
import shapeFactory from "../factories/shape"
import stopFactory from "../factories/stop"
import vehicleFactory, { randomLocationVehicle } from "../factories/vehicle"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"
import { VehicleLabelSetting } from "../../src/userSettings"
import { setHtmlWidthHeightForLeafletMap } from "../testHelpers/leafletMapWidth"

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

jest.mock("../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe("<MapPage />", () => {
  describe("Snapshot", () => {
    test("renders the null state", () => {
      ;(useSearchResults as jest.Mock).mockReturnValue(null)
      const { asFragment } = render(
        <StateDispatchProvider
          state={stateFactory.build()}
          dispatch={jest.fn()}
        >
          <BrowserRouter>
            <MapPage />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(asFragment()).toMatchSnapshot()
    })

    test("renders the empty state", () => {
      ;(useSearchResults as jest.Mock).mockReturnValue([])
      const { asFragment } = render(
        <StateDispatchProvider
          state={stateFactory.build()}
          dispatch={jest.fn()}
        >
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
        <StateDispatchProvider
          state={stateFactory.build()}
          dispatch={jest.fn()}
        >
          <BrowserRouter>
            <MapPage />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(asFragment()).toMatchSnapshot()
    })
  })

  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockImplementationOnce(() => [
      stopFactory.build({ locationType: LocationType.Station }),
    ])

    const { container } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }))

    expect(container.querySelector(".m-station-icon")).toBeVisible()
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
    await userEvent.click(screen.getByRole("cell", { name: "Run" }))

    expect(
      screen.getByRole("generic", { name: /vehicle properties card/i })
    ).toBeVisible()
    expect(container.querySelector(".m-vehicle-map__route-shape")).toBeVisible()
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

    await userEvent.click(screen.getByRole("button", { name: /submit/i }))
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
    const mapSearchPanelQuery: [string, object] = [
      "generic",
      {
        name: /Map Search Panel/i,
      },
    ]

    const vehicles = randomLocationVehicle.buildList(3, {
      // runId,
    })
    const [vehicle] = vehicles
    // const runId = "clickMe"
    const runId = vehicle.runId!

    ;(useVehicleForId as jest.Mock).mockReturnValueOnce(vehicle)
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)
    ;(useTripShape as jest.Mock).mockReturnValue(shapeFactory.buildList(1))

    setHtmlWidthHeightForLeafletMap()
    const { container } = render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
            isActive: true,
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

    await userEvent.click(
      screen.getByRole("button", { name: runIdToLabel(runId) })
    )

    const routeShape = container.querySelector(".m-vehicle-map__route-shape")
    const vehiclePropertiesCard = screen.getByRole("generic", {
      name: /vehicle properties card/i,
    })

    expect(mapSearchPanel).toHaveClass("hidden")
    expect(routeShape).toBeVisible()
    expect(vehiclePropertiesCard).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(vehiclePropertiesCard).not.toBeInTheDocument()
    expect(routeShape).not.toBeInTheDocument()

    expect(screen.getByRole(...mapSearchPanelQuery)).toBeVisible()
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

    expect(container.querySelector(".m-vehicle-icon__label")).toBeVisible()
    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /clear search/i }))
    expect(mockDispatch).toBeCalledTimes(1)
    // Leaflet? something isn't removing this from the DOM as expected....
    // await waitForElementToBeRemoved(document.querySelector(".m-vehicle-icon__label"))
  })

  test("When a vehicle is selected, the search panel should be collapsed", async () => {
    const { id: runId } = RunFactory.build()
    const vehicle = vehicleFactory.build({ runId })
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(useVehicleForId as jest.Mock).mockReturnValue(vehicle)
    ;(useSearchResults as jest.Mock).mockReturnValue(
      [vehicle]
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
    expect(mapSearchPanel).toHaveClass("visible")

    await userEvent.click(
      screen.getByRole("button", {
        name: runId,
      })
    )

    expect(
      screen.getByRole("generic", { name: /vehicle properties card/i })
    ).toBeVisible()
    expect(mapSearchPanel).toHaveClass("hidden")
  })

  test("can collapse and un-collapse the search panel with the drawer tab", async () => {
    render(<MapPage />)

    await userEvent.click(screen.getByRole("button", { name: "Collapse" }))

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "hidden"
    )

    await userEvent.click(screen.getByRole("button", { name: "Expand" }))

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "visible"
    )
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

  describe.skip("when rendering", () => {
    beforeEach(() => {
      setHtmlWidthHeightForLeafletMap()
    })

    // test("when rendered, map should be unpopulated", async () => {
    // Render map
    // Expect nothing on map
    // })

    // test("when search result is selected, should show vehicle icon and label, route, stops, ", async () => {})
    describe("initial state", () => {
      test("search should be empty, map should be empty", () => {
        const changeApplicationState = jest.fn()

        render(
          <StateDispatchProvider
            state={stateFactory.build({
              userSettings: {
                ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
              },
            })}
            dispatch={changeApplicationState}
          >
            <MapPage />
          </StateDispatchProvider>
        )

        const searchInput = screen.getByRole("textbox", { name: /search map/i })
        expect(searchInput).toHaveTextContent("")
        expect(searchInput).toHaveAttribute("placeholder", "Search")

        expect(
          screen.queryAllByRole("button", { name: /^vehicle #/ })
        ).toHaveLength(0)
        expect(changeApplicationState).not.toBeCalled()
      })

      // TODO: is this something I want?
      // TODO: it should probably be in a different section
      test("a new search, calls dispatch with search query", () => {
        const changeApplicationState = jest.fn()

        render(
          <StateDispatchProvider
            state={stateFactory.build({
              userSettings: {
                ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
              },
            })}
            dispatch={changeApplicationState}
          >
            <MapPage />
          </StateDispatchProvider>
        )

        const searchInput = screen.getByRole("textbox", { name: /search map/i })
        expect(searchInput).toHaveTextContent("")
        expect(searchInput).toHaveAttribute("placeholder", "Search")

        expect(
          screen.queryAllByRole("button", { name: /^vehicle #/ })
        ).toHaveLength(0)
        expect(changeApplicationState).not.toBeCalled()
      })
    })

    describe("an active search, without selection", () => {
      test("the map should be unpopulated", () => {
        const changeApplicationState = jest.fn()

        const { id: runId } = RunFactory.build()
        const vehicle = vehicleFactory.build({ runId })
        const shapes = shapeFactory.buildList(2)
        const searchPageState = activeSearchPageStateFactory.build({
          query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
        })

        ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
        ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
          tripId === vehicle.tripId ? shapes : null
        )

        render(
          <StateDispatchProvider
            state={stateFactory.build({ searchPageState })}
            dispatch={changeApplicationState}
          >
            <MapPage />
          </StateDispatchProvider>
        )

        const searchInput = screen.getByRole("textbox", { name: /search map/i })
        expect(searchInput).toHaveTextContent("")
        expect(searchInput).toHaveAttribute("placeholder", "Search")

        expect(screen.queryAllByRole("button", { name: /^run/ })).toHaveLength(
          0
        )
        expect(changeApplicationState).not.toBeCalled()
      })

      test("when search is made, map should be unpopulated until search result is selected", async () => {
        // define elements
        // - vehicle icon
        // - route shape FOR CURRENT DIRECTION
        // - route stops FOR CURRENT DIRECTION
        // -

        // Render with active Search
        // Ensure nothing on map
        // Click Search Result
        // Ensure only results on map
        // jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        const vehicle = vehicleFactory.build({ runId: "clickMe" })

        ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])

        // const activeSearch: SearchPageState =

        const shapes = shapeFactory.buildList(2)
        ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
          tripId === vehicle.tripId ? shapes : null
        )

        const mockDispatch = jest.fn()

        // const { container } = renderMapPageWithSearchState(
        //   searchPageStateFactory.build({
        //     query: { text: "clickMe", property: "run" },
        //     isActive: true,
        //   }),
        //   mockDispatch
        // )
        const { container } = render(<MapPage />, {
          wrapper: (props) => (
            <StateDispatchProvider
              state={stateFactory.build({
                searchPageState: activeSearchPageStateFactory.build({
                  query: searchQueryRunFactory.build({ text: vehicle.runId! }),
                }),
              })}
              dispatch={mockDispatch}
              {...props}
            />
          ),
        })

        const mapSearchPanel = screen.getByRole("generic", {
          name: /map search panel/i,
        })

        // TODO:FIXME: this is not the correct format for this query
        expect(
          screen.queryByRole("button", { name: `run ${vehicle.runId}` })
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole("button", { name: `route ${vehicle.routeId}` })
        ).not.toBeInTheDocument()
        expect(
          container.querySelector(".m-vehicle-icon__label")
        ).not.toBeInTheDocument()
        expect(
          container.querySelector(".m-vehicle-map__route-shape")
        ).not.toBeInTheDocument()

        await userEvent.click(
          screen.getByRole("cell", { name: vehicle.runId! })
        )

        expect(
          container.querySelector(".m-vehicle-icon__label")
        ).toBeInTheDocument()
        expect(
          container.querySelector(".m-vehicle-map__route-shape")
        ).toBeInTheDocument()
        expect(
          screen.getByRole("button", { name: vehicle.runId! })
        ).toBeVisible()

        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
        expect(
          container.querySelector(".m-vehicle-map__route-shape")
        ).toBeVisible()
        expect(mapSearchPanel).not.toBeVisible()
      })
    })

    describe("an active selection", () => {
      test("the map should be populated", () => {
        const changeApplicationState = jest.fn()

        const [selectedRun, unselectedRun] = RunFactory.buildList(2)
        const selectedRouteVehicles = randomLocationVehicle.buildList(7, {
          runId: selectedRun.id,
        })
        const unselectedRouteVehicles = randomLocationVehicle.buildList(5, {
          runId: unselectedRun.id,
        })

        const [selectedVehicle] = selectedRouteVehicles
        // const vehicle = vehicleFactory.build({ runId })
        const shapes = shapeFactory.buildList(2)

        const searchPageState = activeSearchPageStateFactory.build({
          query: searchQueryRunFactory.searchFor(selectedRun.id).build(),
          selectedVehicleId: selectedVehicle.id,
        })

        ;(useSearchResults as jest.Mock).mockReturnValue([
          ...selectedRouteVehicles,
          ...unselectedRouteVehicles,
        ])
        ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
          tripId === selectedVehicle.tripId ? shapes : null
        )

        // const searchPageState = activeSearchPageStateFactory.build({
        //   query: searchQueryRunFactory.build({
        //     text:
        //   })
        // })
        render(
          <StateDispatchProvider
            state={stateFactory.build({
              searchPageState,
              userSettings: {
                // ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
              },
            })}
            dispatch={changeApplicationState}
          >
            <MapPage />
          </StateDispatchProvider>
        )

        // vehicle, route, trip shape, trip stops, route vehicles
        // selection state
        const searchInput = screen.getByRole("textbox", { name: /search map/i })
        expect(searchInput).toHaveTextContent("")
        expect(searchInput).toHaveAttribute("placeholder", "Search")

        expect(
          screen.getAllByRole("button", { name: selectedVehicle.runId! })
        ).toHaveLength(selectedRouteVehicles.length)
        expect(changeApplicationState).not.toBeCalled()
      })

      describe("VehiclePropertiesCard", () => {
        test("should be visible, search panel should be closed", async () => {
          // const runId = "clickMe"
          const vehicle = vehicleFactory.build({})
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
        // describe("renders", () => {
        test("after search result is selected", async () => {
          const runId = "clickMe"
          const vehicle = vehicleFactory.build({ runId })
          jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
          ;(useVehicleForId as jest.Mock).mockReturnValue(vehicle)
          ;(useSearchResults as jest.Mock).mockReturnValue(
            // vehicleFactory.buildList(1, { runId: runId })
            [vehicle]
          )

          render(
            <StateDispatchProvider
              state={stateFactory.build({
                searchPageState: activeSearchPageStateFactory.build({
                  query: { text: runId },
                }),
              })}
              dispatch={jest.fn()}
            >
              <BrowserRouter>
                <MapPage />
              </BrowserRouter>
            </StateDispatchProvider>
          )

          await userEvent.click(
            screen.getByRole("button", {
              name: runIdToLabel(runId),
            })
          )
          expect(
            screen.getByRole("generic", { name: /vehicle properties card/i })
          ).toBeVisible()
        })

        // })
      })

      describe("without a active search", () => {
        // describe("an active selection without a active search", () => {
        // describe("When a regular bus is selected by a search result or VPP(?)", () => {
        describe("is a regular bus", () => {
          test.todo("should display VPC")
          test.todo(
            "should style vehicle icon on map as selected and map should be centered on the vehicle"
          )
          test.todo("should display: vehicle icon, route shape and stops")
          test.todo("should auto center on vehicle by default")
        })

        describe("is a shuttle", () => {
          test.todo("should display VPC")
          test.todo(
            "should style vehicle icon on map as selected and map should be centered on the vehicle"
          )
          test.todo("should not display vehicle route shape and stops")
          test.todo("should auto center on vehicle by default")
        })
        // })
      })

      describe("with an active search", () => {})
    })
  })

  describe("when user interacts with", () => {})
  describe("api", () => {})
})
