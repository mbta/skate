import "@testing-library/jest-dom"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import MapPage from "../../src/components/mapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import * as dateTime from "../../src/util/dateTime"

import userEvent from "@testing-library/user-event"
import useVehicleForId from "../../src/hooks/useVehicleForId"
import { useStations } from "../../src/hooks/useStations"
import { LocationType } from "../../src/models/stopData"
import {
  SearchPageState,
  SelectedEntityType,
} from "../../src/state/searchPageState"
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
import { VehicleId, VehicleInScheduledService, Ghost } from "../../src/realtime"
import { RouteId } from "../../src/schedule"
import { mockUsePatternsByIdForVehicles } from "../testHelpers/mockHelpers"
import { closeView, OpenView } from "../../src/state"
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"
import usePatternsByIdForRoute from "../../src/hooks/usePatternsByIdForRoute"
import { routePatternFactory } from "../factories/routePattern"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { vehiclePropertiesCard } from "../testHelpers/selectors/components/mapPage/vehiclePropertiesCard"
import { routePropertiesCard } from "../testHelpers/selectors/components/mapPage/routePropertiesCard"
import { zoomInButton } from "../testHelpers/selectors/components/map"

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../src/hooks/usePatternsByIdForRoute", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => {
    return {
      is_loading: true,
    }
  }),
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

type VehicleIdToVehicle = {
  [vehicleId: VehicleId]: VehicleInScheduledService | Ghost
}

function mockUseVehicleForIdMap(map: VehicleIdToVehicle) {
  ;(useVehicleForId as jest.Mock).mockImplementation(
    (_, vehicleId) => map[vehicleId!] || null
  )
}

function mockUseVehicleForId(vehicles: (VehicleInScheduledService | Ghost)[]) {
  const vehicleIdToVehicleMap = vehicles.reduce(
    (rest, vehicle) => ({ ...rest, [vehicle.id]: vehicle }),
    {}
  )
  mockUseVehicleForIdMap(vehicleIdToVehicleMap)
}

function mockUseVehiclesForRouteMap(map: {
  [routeId: RouteId]: (VehicleInScheduledService | Ghost)[]
}) {
  ;(useVehiclesForRoute as jest.Mock).mockImplementation(
    (_, routeId: RouteId | null) => map[routeId!] || null
  )
}

function getMapSearchPanel() {
  return screen.getByRole("generic", {
    name: /map search panel/i,
  })
}

function getAllStationIcons(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(".c-station-icon")
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

      const vehicle1 = vehicleFactory.build()
      const vehicle2 = vehicleFactory.build()
      const ghost = ghostFactory.build()

      mockUseVehicleForId([vehicle1])
      mockUseVehiclesForRouteMap({
        [vehicle1.routeId!]: [vehicle1, vehicle2, ghost],
      })

      const { asFragment } = render(
        <StateDispatchProvider
          state={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: vehicle1.id,
              },
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

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(3)
  })

  test("clicking a vehicle on the map, should set vehicle as new selection", async () => {
    mockFullStoryEvent()
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

    mockUsePatternsByIdForVehicles([vehicle, nextVehicle])

    mockUseVehicleForId([vehicle, nextVehicle])
    mockUseVehiclesForRouteMap({ [route.id]: vehicles })

    const mockDispatch = jest.fn()
    const state = stateFactory.build({
      searchPageState: searchPageStateFactory.build({
        selectedEntity: {
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        },
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
      container.querySelector(".c-vehicle-map__route-shape")
    ).toBeInTheDocument()

    expect(container.querySelector(".selected")).toBeVisible()
    expect(window.FS!.event).toHaveBeenCalledWith("VPC Opened")
  })

  test("clicking a vehicle from a search result displays the route shape and card", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const vehicle = vehicleFactory.build({ runId })
    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    mockUsePatternsByIdForVehicles([vehicle])
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

    expect(vehiclePropertiesCard.get()).toBeVisible()
    expect(container.querySelector(".c-vehicle-map__route-shape")).toBeVisible()
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

    mockUsePatternsByIdForVehicles([vehicle])

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
      container.querySelector(".c-vehicle-map__route-shape")
    ).not.toBeInTheDocument()
  })

  test("when vehicle properties card is closed, vehicle properties card should not be visible, search panel should be visible, elements should be removed from the map", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    setHtmlWidthHeightForLeafletMap()

    const vehicles = randomLocationVehicle.buildList(3),
      [vehicle] = vehicles

    ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)
    mockUseVehicleForId(vehicles)
    mockUseVehiclesForRouteMap({ [vehicle.routeId!]: vehicles })
    mockUsePatternsByIdForVehicles([vehicle])

    const { container } = render(
      <RealDispatchWrapper
        initialState={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
            isActive: true,
            selectedEntity: {
              type: SelectedEntityType.Vehicle,
              vehicleId: vehicle.id,
            },
          }),
        })}
      >
        <MapPage />
      </RealDispatchWrapper>
    )
    const mapSearchPanel = getMapSearchPanel()

    await userEvent.click(
      within(mapSearchPanel).getByRole("button", {
        name: new RegExp(vehicle.label!),
      })
    )

    const routeShape = container.querySelector(".c-vehicle-map__route-shape")
    const vpc = vehiclePropertiesCard.get()

    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--hidden")
    expect(routeShape).toBeVisible()
    expect(vpc).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(vpc).not.toBeInTheDocument()
    expect(routeShape).not.toBeInTheDocument()

    expect(getMapSearchPanel()).toBeVisible()
  })

  test("when search is cleared, should still render selection on map", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = runIdFactory.build()
    const vehicle = vehicleFactory.build({ runId })
    const activeSearch: SearchPageState = searchPageStateFactory.build({
      query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
      selectedEntity: {
        type: SelectedEntityType.Vehicle,
        vehicleId: vehicle.id,
      },
    })

    ;(useSearchResults as jest.Mock).mockReturnValue([vehicle])
    mockUsePatternsByIdForVehicles([vehicle])
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

    expect(container.querySelector(".c-vehicle-icon__label")).toBeVisible()
    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: /clear search/i }))
    expect(container.querySelector(".c-vehicle-icon__label")).toBeVisible()
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
    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--visible")

    await userEvent.click(
      screen.getByRole("button", {
        name: new RegExp(runId),
      })
    )

    expect(vehiclePropertiesCard.get()).toBeVisible()
    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--hidden")
  })

  test("can collapse and un-collapse the search panel with the drawer tab", async () => {
    render(<MapPage />)

    await userEvent.click(screen.getByRole("button", { name: "Collapse" }))

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "c-map-page__input-and-results--hidden"
    )

    await userEvent.click(screen.getByRole("button", { name: "Expand" }))

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "c-map-page__input-and-results--visible"
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
                  .searchFor(vehicle.label!)
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
        expect(vehiclePropertiesCard.get()).toBeVisible()
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
                selectedEntity: {
                  type: SelectedEntityType.Vehicle,
                  vehicleId: vehicle.id,
                },
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
            name: vehicleNext.label!,
          })
        )
        expect(vehiclePropertiesCard.get()).toBeVisible()
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
                selectedEntity: {
                  type: SelectedEntityType.Vehicle,
                  vehicleId: vehicle.id,
                },
              }),
            })}
            dispatch={jest.fn()}
          >
            <BrowserRouter>
              <MapPage />
            </BrowserRouter>
          </StateDispatchProvider>
        )

        expect(vehiclePropertiesCard.get()).toBeVisible()
      })
    })
  })

  describe("<RoutePropertiesCard />", () => {
    test("RPC replaces VPC vehicle's route shape is selected", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      mockFullStoryEvent()

      const route = routeFactory.build()
      const routePattern = routePatternFactory.build({ routeId: route.id })
      const vehicle = vehicleFactory.build({
        routeId: route.id,
        routePatternId: routePattern.id,
      })

      mockUseVehicleForId([vehicle])
      mockUseVehiclesForRouteMap({
        [route.id]: [vehicle],
      })
      ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
        [routePattern.id]: routePattern,
      })

      const { container } = render(
        <RealDispatchWrapper
          initialState={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: vehicle.id,
              },
            },
            userSettings: {
              ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
            },
          })}
        >
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </RealDispatchWrapper>
      )
      expect(vehiclePropertiesCard.get()).toBeVisible()

      fireEvent.click(container.querySelector(".c-vehicle-map__route-shape")!)
      await waitFor(() => expect(routePropertiesCard.get()).toBeVisible())
      expect(vehiclePropertiesCard.query()).not.toBeInTheDocument()
    })
    test("clicking vehicle when RPC is open closes RPC and opens VPC", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

      const route = routeFactory.build()
      const routePattern = routePatternFactory.build({ routeId: route.id })
      const vehicle = vehicleFactory.build({
        routeId: route.id,
        routePatternId: routePattern.id,
      })

      mockUseVehicleForId([vehicle])
      mockUseVehiclesForRouteMap({
        [route.id]: [vehicle],
      })
      ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
        [routePattern.id]: routePattern,
      })

      render(
        <RealDispatchWrapper
          initialState={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.RoutePattern,
                routeId: route.id,
                routePatternId: routePattern.id,
              },
            },
            userSettings: {
              ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
            },
          })}
        >
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </RealDispatchWrapper>
      )
      expect(routePropertiesCard.get()).toBeVisible()
      await userEvent.click(
        screen.getByRole("button", {
          name: vehicle.label!,
        })
      )

      expect(routePropertiesCard.query()).not.toBeInTheDocument()
      expect(vehiclePropertiesCard.get()).toBeVisible()
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
        const searchPageState = activeSearchPageStateFactory.build({
          query: searchQueryRunFactory.searchFor(vehicle.runId!).build(),
        })

        ;(useSearchResults as jest.Mock).mockReturnValue(vehicles)
        mockUsePatternsByIdForVehicles([vehicle])

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

        mockUsePatternsByIdForVehicles([vehicle])
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

        const mapContainer = container.querySelector(".c-map-page__map")!
        expect(
          mapContainer.querySelector(".c-vehicle-icon__label")
        ).not.toBeInTheDocument()
        expect(
          mapContainer.querySelector(".c-vehicle-map__route-shape")
        ).not.toBeInTheDocument()

        await userEvent.click(
          screen.getByRole("button", {
            name: new RegExp(`Vehicle ${vehicle.label}`),
          })
        )

        expect(
          mapContainer.querySelector(".c-vehicle-icon__label")
        ).toBeInTheDocument()
        expect(
          mapContainer.querySelector(".c-vehicle-map__route-shape")
        ).toBeInTheDocument()
        expect(
          screen.getAllByRole("button", { name: runIdToLabel(vehicle.runId!) })
        ).toHaveLength(vehicles.length)

        expect(vehiclePropertiesCard.get()).toBeVisible()
        expect(
          mapContainer.querySelector(".c-vehicle-map__route-shape")
        ).toBeVisible()
      })
    })

    describe("with an active selection", () => {
      describe("and selection is a vehicle", () => {
        const selectedStateFactory = (selectedVehicleId: string) =>
          stateFactory.params({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicleId,
              },
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

          mockUsePatternsByIdForVehicles([selectedVehicle])

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
            const stopCount = 8

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([selectedVehicle])
            mockUseVehiclesForRouteMap({ [route.id]: selectedRouteVehicles })
            mockUsePatternsByIdForVehicles([selectedVehicle], {
              stopCount: 8,
            })

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
              container.querySelectorAll(".c-vehicle-map__stop")
            ).toHaveLength(stopCount)
            expect(
              container.querySelector(".c-vehicle-map__route-shape")
            ).toBeInTheDocument()
          })

          test("should display vehicle icon when selected vehicle is no longer on route", () => {
            const changeApplicationState = jest.fn()

            const route = routeFactory.build()

            const selectedRouteVehicles = randomLocationVehicle.buildList(7, {
              routeId: route.id,
            })

            const [selectedVehicle] = selectedRouteVehicles

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([
              { ...selectedVehicle, routeId: "some_other_route" },
            ])
            mockUseVehiclesForRouteMap({
              [route.id]: selectedRouteVehicles.slice(1),
            })
            mockUsePatternsByIdForVehicles([selectedVehicle], {
              stopCount: 8,
            })

            render(
              <StateDispatchProvider
                state={selectedStateFactory(selectedVehicle.id).build()}
                dispatch={changeApplicationState}
              >
                <MapPage />
              </StateDispatchProvider>
            )

            expect(
              screen.getAllByRole("button", {
                name: runIdToLabel(selectedVehicle.runId!),
              })
            ).toHaveLength(1)
          })
        })

        test("and vehicle is a shuttle; should display: vehicle icon, but not route shape or stops", () => {
          const changeApplicationState = jest.fn()

          const selectedVehicle = shuttleFactory.build()

          setHtmlWidthHeightForLeafletMap()
          mockUseVehiclesForRouteMap({})
          mockUseVehicleForId([selectedVehicle])
          mockUsePatternsByIdForVehicles([selectedVehicle])

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
            container.querySelectorAll(".c-vehicle-map__stop")
          ).toHaveLength(0)
          expect(
            container.querySelector(".c-vehicle-map__route-shape")
          ).not.toBeInTheDocument()
          expect(
            within(vehiclePropertiesCard.get()).getByRole("status", {
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
                  selectedEntity: {
                    type: SelectedEntityType.Vehicle,
                    vehicleId: ghost.id,
                  },
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
          expect(vehiclePropertiesCard.get()).toBeVisible()
        })
      })
    })
  })
})
