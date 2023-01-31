import "@testing-library/jest-dom"
import { render, screen, within } from "@testing-library/react"
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
import { RunFactory, runIdFactory } from "../factories/run"
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
import vehicleFactory, {
  randomLocationVehicle,
  shuttleFactory,
} from "../factories/vehicle"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"
import { VehicleLabelSetting } from "../../src/userSettings"
import { setHtmlWidthHeightForLeafletMap } from "../testHelpers/leafletMapWidth"
import useVehiclesForRoute from "../../src/hooks/useVehiclesForRoute"
import routeFactory from "../factories/route"
import { RealDispatchWrapper } from "../testHelpers/wrappers"
import { VehicleId, VehicleOrGhost } from "../../src/realtime"
import { RouteId, Shape, TripId } from "../../src/schedule"
import { closeView, OpenView } from "../../src/state"

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
  jest.restoreAllMocks()
})

type VehicleIdToVehicle = {
  [vehicleId: VehicleId]: VehicleOrGhost
}

function mockUseVehicleForIdMap(map: VehicleIdToVehicle) {
  ;(useVehicleForId as jest.Mock).mockImplementation(
    (_, vehicleId) => map[vehicleId!] || null
  )
}

function mockUseVehicleForId(vehicles: VehicleOrGhost[]) {
  const vehicleIdToVehicleMap = vehicles.reduce(
    (rest, vehicle) => ({ ...rest, [vehicle.id]: vehicle }),
    {}
  )
  mockUseVehicleForIdMap(vehicleIdToVehicleMap)
}

function mockUseTripShape(map: { [tripId: TripId]: Shape }) {
  ;(useTripShape as jest.Mock).mockImplementation((tripId) =>
    [map[tripId!]].filter(Boolean)
  )
}

function mockUseVehiclesForRouteMap(map: {
  [routeId: RouteId]: VehicleOrGhost[]
}) {
  ;(useVehiclesForRoute as jest.Mock).mockImplementation(
    (_, routeId: RouteId | null) => map[routeId!] || null
  )
}

function getVehiclePropertiesCard() {
  return screen.getByRole("generic", {
    name: /vehicle properties card/i,
  })
}

function getMapSearchPanel() {
  return screen.getByRole("generic", {
    name: /map search panel/i,
  })
}

function getMapZoomInButton(): Element {
  return screen.getByRole("button", { name: "Zoom in" })
}

function getAllStationIcons(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(".m-station-icon")
}

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
      jest
        .spyOn(dateTime, "now")
        .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

      jest.spyOn(Date, "now").mockImplementation(() => 234000)

      const vehicle = vehicleFactory.build()
      const ghost = ghostFactory.build()

      mockUseVehicleForId([vehicle])
      mockUseVehiclesForRouteMap({ [vehicle.routeId!]: [vehicle, ghost] })

      const { asFragment } = render(
        <StateDispatchProvider
          state={stateFactory.build({
            searchPageState: {
              selectedVehicleId: vehicle.id,
            },
          })}
          dispatch={jest.fn()}
        >
          <MapPage />
        </StateDispatchProvider>
      )

      expect(asFragment()).toMatchSnapshot()
    })
  })

  test("closes any open views on page render", () => {
    const dispatch = jest.fn()

    render(
      <StateDispatchProvider
        state={stateFactory.build({ openView: OpenView.Swings })}
        dispatch={dispatch}
      >
        <MapPage />
      </StateDispatchProvider>
    )

    expect(dispatch).toHaveBeenCalledWith(closeView())
  })

  test("doesn't close VPP if open", () => {
    const selectedVehicle = vehicleFactory.build()
    const dispatch = jest.fn()

    render(
      <StateDispatchProvider
        state={stateFactory.build({ selectedVehicleOrGhost: selectedVehicle })}
        dispatch={dispatch}
      >
        <MapPage />
      </StateDispatchProvider>
    )

    expect(dispatch).not.toHaveBeenCalledWith(closeView())
  })

  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockReturnValue(
      stopFactory.params({ locationType: LocationType.Station }).buildList(3)
    )

    const { container } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <MapPage />
      </StateDispatchProvider>
    )

    expect(getAllStationIcons(container)).toHaveLength(0)

    const zoomIn = getMapZoomInButton()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(3)
  })

  test("on mobile, shows the results list initially", () => {
    const { container } = render(<MapPage />)

    expect(container.firstChild).toHaveClass("m-map-page--show-list")
  })

  test("clicking a vehicle on the map, should set vehicle as new selection", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const route = routeFactory.build()
    const routeVehicleFactory = vehicleFactory.params({ routeId: route.id })
    const vehicles = [
        routeVehicleFactory.build({ runId: runIdFactory.build() }),
        routeVehicleFactory.build({ runId: runIdFactory.build() }),
        ...routeVehicleFactory.buildList(3),
      ],
      [vehicle, nextVehicle] = vehicles,
      { runId } = nextVehicle
    ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)

    const [a, b] = shapeFactory.buildList(2)
    mockUseTripShape({
      [vehicle.tripId!]: a,
      [nextVehicle.tripId!]: b,
    })

    mockUseVehicleForId([vehicle, nextVehicle])
    mockUseVehiclesForRouteMap({ [route.id]: vehicles })

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

    await userEvent.click(screen.getByRole("button", { name: runId! }))
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
    mockUseTripShape({ [vehicle.tripId!]: shapeFactory.build() })
    mockUseVehicleForId([vehicle])

    const { container } = render(
      <RealDispatchWrapper
        initialState={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "clickMe", property: "run" },
            isActive: true,
          }),
        })}
      >
        <MapPage />
      </RealDispatchWrapper>
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

    const shape = shapeFactory.build()
    mockUseTripShape({ [vehicle.tripId!]: shape })

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
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    setHtmlWidthHeightForLeafletMap()

    const vehicles = randomLocationVehicle.buildList(3),
      [vehicle] = vehicles

    ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)
    mockUseVehicleForId(vehicles)
    mockUseVehiclesForRouteMap({ [vehicle.routeId!]: vehicles })
    mockUseTripShape({ [vehicle.tripId!]: shapeFactory.build() })

    const { container } = render(
      <RealDispatchWrapper
        initialState={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
            isActive: true,
            selectedVehicleId: vehicle.id,
          }),
        })}
      >
        <MapPage />
      </RealDispatchWrapper>
    )
    const mapSearchPanel = getMapSearchPanel()

    await userEvent.click(
      within(mapSearchPanel).getByRole("button", {
        name: new RegExp(vehicle.label),
      })
    )

    const routeShape = container.querySelector(".m-vehicle-map__route-shape")
    const vehiclePropertiesCard = getVehiclePropertiesCard()

    expect(mapSearchPanel).toHaveClass("hidden")
    expect(routeShape).toBeVisible()
    expect(vehiclePropertiesCard).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(vehiclePropertiesCard).not.toBeInTheDocument()
    expect(routeShape).not.toBeInTheDocument()

    expect(getMapSearchPanel()).toBeVisible()
  })

  test("when search is cleared, should still render selection on map", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = runIdFactory.build()
    const vehicle = vehicleFactory.build({ runId })
    const shape = shapeFactory.build()
    const activeSearch: SearchPageState = searchPageStateFactory.build({
      query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
      selectedVehicleId: vehicle.id,
    })

    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    mockUseTripShape({ [vehicle.tripId!]: shape })
    mockUseVehicleForId([vehicle])
    mockUseVehiclesForRouteMap({
      [vehicle.routeId!]: [vehicle],
    })

    const { container } = render(
      <RealDispatchWrapper
        initialState={stateFactory.build({ searchPageState: activeSearch })}
      >
        <MapPage />
      </RealDispatchWrapper>
    )

    expect(container.querySelector(".m-vehicle-icon__label")).toBeVisible()
    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /clear search/i }))
    expect(container.querySelector(".m-vehicle-icon__label")).toBeVisible()
  })

  test("When a vehicle is selected, the search panel should be collapsed", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const runId = runIdFactory.build()
    const vehicle = vehicleFactory.associations({ runId }).build()

    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    mockUseVehicleForId([vehicle])
    mockUseVehiclesForRouteMap({ [vehicle.routeId!]: [vehicle] })

    render(
      <RealDispatchWrapper
        initialState={stateFactory.build({
          searchPageState: activeSearchPageStateFactory.build({
            query: { text: vehicle.runId! },
          }),
        })}
      >
        <MapPage />
      </RealDispatchWrapper>
    )

    const mapSearchPanel = getMapSearchPanel()
    expect(mapSearchPanel).toHaveClass("visible")

    await userEvent.click(
      screen.getByRole("button", {
        name: new RegExp(runId),
      })
    )

    expect(getVehiclePropertiesCard()).toBeVisible()
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

  describe("<VehiclePropertiesCard />", () => {
    describe("renders", () => {
      test("after search result is selected", async () => {
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        const vehicle = vehicleFactory.build({})
        ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
        mockUseVehicleForId([vehicle])

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
        const routeVehicles = vehicleFactory
            .associations({ routeId: route.id })
            .buildList(3),
          [vehicle, vehicleNext] = routeVehicles

        mockUseVehicleForId([vehicle, vehicleNext])
        mockUseVehiclesForRouteMap({
          [route.id]: routeVehicles,
        })

        render(
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

        await userEvent.click(
          screen.getByRole("button", {
            name: vehicleNext.label,
          })
        )
        expect(getVehiclePropertiesCard()).toBeVisible()
      })

      test("when page is rendered with a vehicle selected, page should have vehicle properties card open and search panel collapsed", async () => {
        const runId = "clickMe"
        const vehicle = vehicleFactory.build({ runId })

        ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
        mockUseVehicleForId([vehicle])

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

  describe("when rendering the map", () => {
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
      })
    })

    describe("with an active search, and without any selection", () => {
      test("the map should be unpopulated", () => {
        const changeApplicationState = jest.fn()

        const { id: runId } = RunFactory.build()
        const vehicles = vehicleFactory.buildList(3, { runId }),
          [vehicle] = vehicles
        const shape = shapeFactory.build()
        const searchPageState = activeSearchPageStateFactory.build({
          query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
        })

        ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)
        mockUseTripShape({ [vehicle.tripId!]: shape })

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
      })

      test("when a search is made, the map should be unpopulated until search result is selected", async () => {
        const run = RunFactory.build()
        const vehicles = vehicleFactory.buildList(3, { runId: run.id }),
          [vehicle] = vehicles

        ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)

        const shape = shapeFactory.build({
          stops: stopFactory.buildList(3),
        })
        mockUseTripShape({ [vehicle.tripId!]: shape })
        mockUseVehicleForId([vehicle])
        mockUseVehiclesForRouteMap({
          [vehicle.routeId!]: vehicles,
        })

        const state = stateFactory.build({
          searchPageState: activeSearchPageStateFactory.build({
            query: searchQueryRunFactory.build({ text: vehicle.runId! }),
          }),
        })
        const { container } = render(
          <RealDispatchWrapper initialState={state}>
            <MapPage />
          </RealDispatchWrapper>
        )

        expect(
          screen.queryByRole("button", { name: `run ${vehicle.runId}` })
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole("button", { name: `route ${vehicle.routeId}` })
        ).not.toBeInTheDocument()

        const mapContainer = container.querySelector(".m-map-page__map")!
        expect(
          mapContainer.querySelector(".m-vehicle-icon__label")
        ).not.toBeInTheDocument()
        expect(
          mapContainer.querySelector(".m-vehicle-map__route-shape")
        ).not.toBeInTheDocument()

        await userEvent.click(
          screen.getByRole("button", {
            name: new RegExp(`Vehicle ${vehicle.label}`),
          })
        )

        expect(
          mapContainer.querySelector(".m-vehicle-icon__label")
        ).toBeInTheDocument()
        expect(
          mapContainer.querySelector(".m-vehicle-map__route-shape")
        ).toBeInTheDocument()
        expect(
          screen.getAllByRole("button", { name: runIdToLabel(vehicle.runId!) })
        ).toHaveLength(vehicles.length)

        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()
        expect(
          mapContainer.querySelector(".m-vehicle-map__route-shape")
        ).toBeVisible()
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

          mockUseVehicleForId([selectedVehicle])
          mockUseVehiclesForRouteMap({
            [route.id]: selectedRouteVehicles,
          })

          const shape = shapeFactory.build()
          mockUseTripShape({ [selectedVehicle.tripId!]: shape })

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
        })

        describe("and vehicle is a regular bus", () => {
          test("should display: vehicle icon, route shape and stops", () => {
            const changeApplicationState = jest.fn()

            const route = routeFactory.build()

            const selectedRouteVehicles = randomLocationVehicle.buildList(7, {
              routeId: route.id,
              runId: runIdFactory.build(),
            })

            const [selectedVehicle] = selectedRouteVehicles
            const shape = shapeFactory.build({
              stops: stopFactory.buildList(8),
            })

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([selectedVehicle])
            mockUseVehiclesForRouteMap({ [route.id]: selectedRouteVehicles })
            mockUseTripShape({ [selectedVehicle.tripId!]: shape })

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
            ).toHaveLength(shape.stops?.length || 0)
            expect(
              container.querySelector(".m-vehicle-map__route-shape")
            ).toBeInTheDocument()
          })
        })

        test("and vehicle is a shuttle; should display: vehicle icon, but not route shape or stops", () => {
          const changeApplicationState = jest.fn()

          const selectedVehicle = shuttleFactory.build()

          const shape = shapeFactory.build({
            stops: stopFactory.buildList(8),
          })

          setHtmlWidthHeightForLeafletMap()
          mockUseVehiclesForRouteMap({})
          mockUseVehicleForId([selectedVehicle])
          mockUseTripShape({ [selectedVehicle.tripId!]: shape })

          const { container } = render(
            <StateDispatchProvider
              state={selectedStateFactory(selectedVehicle.id).build()}
              dispatch={changeApplicationState}
            >
              <MapPage />
            </StateDispatchProvider>
          )

          const selectedVehicleLabel = screen.getByRole("button", {
            name: selectedVehicle.label!,
          })
          expect(selectedVehicleLabel).toBeInTheDocument()
          // this should be expressed via some accessibility property
          expect(selectedVehicleLabel).toHaveClass("selected")

          expect(
            container.querySelectorAll(".m-vehicle-map__stop")
          ).toHaveLength(0)
          expect(
            container.querySelector(".m-vehicle-map__route-shape")
          ).not.toBeInTheDocument()
          expect(
            within(getVehiclePropertiesCard()).getByRole("status", {
              name: /route variant name/i,
            })
          ).toHaveTextContent("Shuttle")
        })
      })

      describe("selection is a ghost", () => {
        test("the map should be unpopulated and centered on default location", () => {
          const changeApplicationState = jest.fn()
          const ghost = ghostFactory.build()
          mockUseVehicleForId([ghost])
          mockUseVehiclesForRouteMap({ [ghost.routeId!]: [ghost] })

          render(
            <StateDispatchProvider
              state={stateFactory.build({
                searchPageState: {
                  selectedVehicleId: ghost.id,
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
          expect(getVehiclePropertiesCard()).toBeVisible()
        })
      })
    })
  })
})
