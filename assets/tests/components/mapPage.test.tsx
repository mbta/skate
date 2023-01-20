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
import {
  activeSearchPageStateFactory,
  searchPageStateFactory,
} from "../factories/searchPageState"
import {
  searchQueryRunFactory,
  searchQueryVehicleFactory,
} from "../factories/searchQuery"
import shapeFactory from "../factories/shape"
import stopFactory from "../factories/stop"
import vehicleFactory, { randomLocationVehicle } from "../factories/vehicle"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"
import { VehicleLabelSetting } from "../../src/userSettings"
import { setHtmlWidthHeightForLeafletMap } from "../testHelpers/leafletMapWidth"
import useVehiclesForRoute from "../../src/hooks/useVehiclesForRoute"
import routeFactory from "../factories/route"
import { RealDispatchWrapper } from "../testHelpers/wrappers"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(),
}))

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useVehiclesForRoute", () => ({
  __esModule: true,
  default: jest.fn(() => null),
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
    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])

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

  describe.only("VehiclePropertiesCard", () => {
    describe("renders", () => {
      test("after search result is selected", async () => {
        const vehicle = vehicleFactory.build({})
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        ;(useVehicleForId as jest.Mock).mockImplementation((_, vehicleId) =>
          vehicleId === vehicle.id ? vehicle : null
        )
        ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])

        render(
          <RealDispatchWrapper
            initialState={stateFactory.build({
              searchPageState: activeSearchPageStateFactory.build({
                query: searchQueryVehicleFactory
                  .searchFor(vehicle.label)
                  .build(),
              }),
            })}
          >
            <MapPage />
          </RealDispatchWrapper>
        )

        await userEvent.click(
          screen.getByRole("button", {
            name: new RegExp(`Vehicle ${vehicle.label}`),
          })
        )
        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
      })

      test("after vehicle on the map is clicked", async () => {
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

        const route = routeFactory.build()
        const routeVehicles = vehicleFactory.buildList(3, {
            routeId: route.id,
          }),
          [vehicle, vehicleNext] = routeVehicles

        ;(useVehicleForId as jest.Mock).mockImplementation(
          (_, vehicleId) =>
            ({
              [vehicle.id]: vehicle,
              [vehicleNext.id]: vehicleNext,
            }[vehicleId] || null)
        )
        ;(useVehiclesForRoute as jest.Mock).mockImplementation(
          (_, routeId) =>
            ({
              [route.id]: routeVehicles,
            }[routeId] || null)
        )

        const { container } = render(
          <RealDispatchWrapper
            initialState={stateFactory.build({
              searchPageState: {
                selectedVehicleId: vehicle.id,
              },
              userSettings: {
                ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
              },
            })}
          >
            <MapPage />
          </RealDispatchWrapper>
        )

        screen.debug(
          container.querySelector(".leaflet-marker-pane") || undefined
        )
        await userEvent.click(
          screen.getByRole("button", {
            name: vehicleNext.label,
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

  describe.only("when rendering the map", () => {
    // test("when rendered, map should be unpopulated", async () => {
    // Render map
    // Expect nothing on map
    // })

    // test("when search result is selected, should show vehicle icon and label, route, stops, ", async () => {})
    describe("with initial state: inactive search, no selection", () => {
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
    })

    describe("an active search, without selection", () => {
      test("the map should be unpopulated", () => {
        const changeApplicationState = jest.fn()

        const { id: runId } = RunFactory.build()
        const vehicles = vehicleFactory.buildList(3, { runId }),
          [vehicle] = vehicles
        const shapes = shapeFactory.buildList(2)
        const searchPageState = activeSearchPageStateFactory.build({
          query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
        })

        ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)
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
        // const vehicle = vehicleFactory.build({ runId: "clickMe" })
        // const vehicles = vehicleFactory.buildList(3, { runId: "clickMe" }),
        const run = RunFactory.build()
        const vehicles = vehicleFactory.buildList(3, { runId: run.id }),
          [vehicle] = vehicles

        ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)

        // const activeSearch: SearchPageState =

        const shapes = shapeFactory.buildList(2, {
          stops: stopFactory.buildList(3),
        })
        ;(useVehicleForId as jest.Mock).mockImplementation((_, vehicleId) =>
          vehicleId === vehicle.id ? vehicle : null
        )
        ;(useVehiclesForRoute as jest.Mock).mockImplementation((_, routeId) =>
          routeId === vehicle.routeId ? vehicles : null
        )
        ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
          tripId === vehicle.tripId ? shapes : null
        )

        const state = stateFactory.build({
          searchPageState: activeSearchPageStateFactory.build({
            query: searchQueryRunFactory.build({ text: vehicle.runId! }),
          }),
        })
        // const { container } = renderMapPageWithSearchState(
        //   searchPageStateFactory.build({
        //     query: { text: "clickMe", property: "run" },
        //     isActive: true,
        //   }),
        //   mockDispatch
        // )
        const { container } = render(
          <RealDispatchWrapper initialState={state}>
            <MapPage />
          </RealDispatchWrapper>
        )

        // const mapSearchPanel = screen.getByRole("generic", {
        //   name: /map search panel/i,
        // })
        const searchMapForm = screen.getByRole("form", {
          name: /search map/i,
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

        // await userEvent.click(screen.getByRole("cell", { name: vehicle.id! }))
        await userEvent.click(
          screen.getByRole("button", {
            name: new RegExp(`Vehicle ${vehicle.label}`),
          })
        )

        // screen.debug(
        //   container.querySelector(".m-search-results__list") || undefined
        // )
        screen.debug(container.querySelector(".m-vehicle-map") || undefined)
        expect(
          container.querySelector(".m-vehicle-icon__label")
        ).toBeInTheDocument()
        expect(
          container.querySelector(".m-vehicle-map__route-shape")
        ).toBeInTheDocument()
        expect(
          screen.getAllByRole("button", { name: runIdToLabel(vehicle.runId!) })
        ).toHaveLength(vehicles.length)

        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
        expect(
          container.querySelector(".m-vehicle-map__route-shape")
        ).toBeVisible()
        expect(searchMapForm).not.toBeVisible()
      })
    })

    describe("with an active selection", () => {
      describe("and selection is a vehicle", () => {
        const selectedStateFactory = (selectedVehicleId: string) =>
          stateFactory.params({
            searchPageState: {
              selectedVehicleId,
            },
          })

        test("the map should show the selected vehicle", () => {
          setHtmlWidthHeightForLeafletMap()
          const changeApplicationState = jest.fn()

          const run = RunFactory.build()
          const route = routeFactory.build()

          const selectedRouteVehicles = randomLocationVehicle.buildList(7, {
            routeId: route.id,
            runId: run.id,
          })

          const [selectedVehicle] = selectedRouteVehicles

          ;(useVehicleForId as jest.Mock).mockImplementation((_, vehicleId) =>
            vehicleId === selectedVehicle.id ? selectedVehicle : null
          )
          ;(useVehiclesForRoute as jest.Mock).mockImplementation((_, routeId) =>
            routeId === route.id ? selectedRouteVehicles : null
          )

          const shapes = shapeFactory.buildList(1)
          ;(useTripShape as jest.Mock).mockImplementation(
            (tripId: string | null) =>
              tripId === selectedVehicle.tripId ? shapes : null
          )

          render(
            <StateDispatchProvider
              state={selectedStateFactory(selectedVehicle.id).build()}
              dispatch={changeApplicationState}
            >
              <MapPage />
            </StateDispatchProvider>
          )

          expect(
            screen.getAllByRole("button", { name: selectedVehicle.runId! })
          ).toHaveLength(selectedRouteVehicles.length)
          expect(changeApplicationState).not.toBeCalled()
        })

        describe("and vehicle is a regular bus", () => {
          test.todo(
            "should style vehicle icon on map as selected and map should be centered on the vehicle"
          )

          test("should display: vehicle icon, route shape and stops", () => {
            const changeApplicationState = jest.fn()

            const run = RunFactory.build()
            const route = routeFactory.build()

            const selectedRouteVehicles = randomLocationVehicle.buildList(7, {
              routeId: route.id,
              runId: run.id,
            })

            const [selectedVehicle] = selectedRouteVehicles
            const shapes = shapeFactory.buildList(1, {
              stops: stopFactory.buildList(8),
            })

            setHtmlWidthHeightForLeafletMap()
            ;(useVehicleForId as jest.Mock).mockImplementation((_, vehicleId) =>
              vehicleId === selectedVehicle.id ? selectedVehicle : null
            )
            ;(useVehiclesForRoute as jest.Mock).mockImplementation(
              (_, routeId) =>
                routeId === route.id ? selectedRouteVehicles : null
            )
            ;(useTripShape as jest.Mock).mockImplementation(
              (tripId: string | null) =>
                tripId === selectedVehicle.tripId ? shapes : null
            )

            const { container } = render(
              <StateDispatchProvider
                state={selectedStateFactory(selectedVehicle.id).build()}
                dispatch={changeApplicationState}
              >
                <MapPage />
              </StateDispatchProvider>
            )

            expect(
              screen.getAllByRole("button", { name: selectedVehicle.runId! })
            ).toHaveLength(selectedRouteVehicles.length)

            expect(
              container.querySelectorAll(".m-vehicle-map__stop")
            ).toHaveLength(shapes[0]?.stops?.length || 0)
            expect(container.querySelector(".m-vehicle-map__route-shape"))
              .toBeInTheDocument

            expect(changeApplicationState).not.toHaveBeenCalled()
          })

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
      })

      describe("selection is a ghost", () => {
        test("the map should be unpopulated and centered on default location", () => {
          const changeApplicationState = jest.fn()

          const vehicle = ghostFactory.build()
          ;(useVehicleForId as jest.Mock).mockImplementation((_, id) =>
            id === vehicle.id ? vehicle : undefined
          )
          // ;(useSearchResults as jest.Mock).mockReturnValue([vehicle, ...vehicleFactory.buildList(3)])

          render(
            <StateDispatchProvider
              state={stateFactory.build({
                searchPageState: {
                  selectedVehicleId: vehicle.id,
                },
              })}
              dispatch={changeApplicationState}
            >
              <MapPage />
            </StateDispatchProvider>
          )

          expect(
            screen.queryAllByRole("button", { name: /^run/ })
          ).toHaveLength(0)
          expect(changeApplicationState).not.toBeCalled()
        })
      })

      // describe("<VehiclePropertiesCard />", () => {
      //   test("should be visible, search panel should be closed", async () => {
      //     // const runId = "clickMe"
      //     const vehicle = vehicleFactory.build({})
      //     ;(useVehicleForId as jest.Mock).mockReturnValue(vehicle)
      //     ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])

      //     render(
      //       <StateDispatchProvider
      //         state={stateFactory.build({
      //           searchPageState: searchPageStateFactory.build({
      //             selectedVehicleId: vehicle.id,
      //           }),
      //         })}
      //         dispatch={jest.fn()}
      //       >
      //         <BrowserRouter>
      //           <MapPage />
      //         </BrowserRouter>
      //       </StateDispatchProvider>
      //     )

      //     expect(
      //       screen.getByRole("generic", { name: /vehicle properties card/i })
      //     ).toBeVisible()
      //   })
      //   // describe("renders", () => {
      //   test("after search result is selected", async () => {
      //     const runId = "clickMe"
      //     const vehicle = vehicleFactory.build({ runId })
      //     jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      //     ;(useVehicleForId as jest.Mock).mockImplementation((_, vehicleId) =>
      //       vehicleId === vehicle.id ? vehicle : null
      //     )
      //     ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])

      //     render(
      //       <RealDispatchWrapper
      //         initialState={stateFactory.build({
      //           searchPageState: activeSearchPageStateFactory.build({
      //             query: { text: runId },
      //           }),
      //         })}
      //       >
      //         <MapPage />
      //       </RealDispatchWrapper>
      //     )

      //     await userEvent.click(
      //       screen.getByRole("cell", {
      //         name: runIdToLabel(runId),
      //       })
      //     )
      //     expect(
      //       screen.getByRole("generic", { name: /vehicle properties card/i })
      //     ).toBeVisible()
      //   })
      // })

      describe("without a active search", () => {
        // describe("an active selection without a active search", () => {
        // describe("When a regular bus is selected by a search result or VPP(?)", () => {
        // })
      })
    })
  })

  describe("when user interacts with", () => {})
  describe("api", () => {})
})
