import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import {
  fireEvent,
  getByRole,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import MapPage from "../../src/components/mapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { useLocationSearchResults } from "../../src/hooks/useLocationSearchResults"
import * as dateTime from "../../src/util/dateTime"

import userEvent from "@testing-library/user-event"
import useVehicleForId from "../../src/hooks/useVehicleForId"
import { useAllStops } from "../../src/hooks/useAllStops"
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
import {
  VehicleId,
  VehicleInScheduledService,
  Ghost,
  Vehicle,
} from "../../src/realtime"
import { RouteId } from "../../src/schedule"
import {
  mockScreenSize,
  mockTileUrls,
  mockUsePatternsByIdForVehicles,
} from "../testHelpers/mockHelpers"
import usePatternsByIdForRoute from "../../src/hooks/usePatternsByIdForRoute"
import { routePatternFactory } from "../factories/routePattern"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { vehiclePropertiesCard } from "../testHelpers/selectors/components/mapPage/vehiclePropertiesCard"
import { routePropertiesCard } from "../testHelpers/selectors/components/mapPage/routePropertiesCard"
import {
  layersControlButton,
  zoomInButton,
} from "../testHelpers/selectors/components/map"
import {
  searchInput as searchFormSearchInput,
  submitButton as searchFormSubmitButton,
} from "../testHelpers/selectors/components/searchForm"
import locationSearchResultFactory from "../factories/locationSearchResult"
import { useLocationSearchResultById } from "../../src/hooks/useLocationSearchResultById"
import {
  getAllStationIcons,
  getAllStopIcons,
} from "../testHelpers/selectors/components/mapPage/map"
import useSearchResultsByCategory from "../../src/hooks/useSearchResultsByCategory"
import { useLocationSearchSuggestions } from "../../src/hooks/useLocationSearchSuggestions"
import { fullStoryEvent } from "../../src/helpers/fullStory"
import { recenterControl } from "../testHelpers/selectors/components/map/controls/recenterControl"
import { useMinischeduleRun } from "../../src/hooks/useMinischedule"
import pieceFactory from "../factories/piece"
import { mockUsePanelState } from "../testHelpers/usePanelStateMocks"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"

jest.mock("../../src/hooks/useLocationSearchResults", () => ({
  useLocationSearchResults: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useLocationSearchSuggestions", () => ({
  useLocationSearchSuggestions: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useLocationSearchResultById", () => ({
  default: jest.fn(() => null),
  useLocationSearchResultById: jest.fn(() => null),
}))

jest.mock("../../src/hooks/usePatternsByIdForRoute", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useNearestIntersection", () => ({
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

jest.mock("../../src/hooks/useAllStops", () => ({
  useAllStops: jest.fn(() => []),
}))

jest.mock("../../src/hooks/useStations", () => ({
  useStations: jest.fn(() => []),
}))

jest.mock("../../src/hooks/useMinischedule")

jest.mock("../../src/tilesetUrls", () => ({
  tilesetUrlForType: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useSearchResultsByCategory", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../src/helpers/fullStory")

jest.mock("../../src/hooks/usePanelState")

jest.mock("../../src/userTestGroups")

const mockVehicleSearchResultsCategory = (
  vehicles: (Vehicle | Ghost)[] | null
) => {
  jest.mocked(useSearchResultsByCategory).mockReturnValue({
    location: null,
    vehicle: vehicles && {
      ok: {
        hasMoreMatches: false,
        matches: vehicles,
      },
    },
  })

  jest.mocked(useLocationSearchSuggestions).mockReturnValue(null)
}

type VehicleIdToVehicle = {
  [vehicleId: VehicleId]: VehicleInScheduledService | Ghost
}

function mockUseVehicleForIdMap(map: VehicleIdToVehicle) {
  ;(useVehicleForId as jest.Mock<typeof useVehicleForId>).mockImplementation(
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
  ;(
    useVehiclesForRoute as jest.Mock<typeof useVehiclesForRoute>
  ).mockImplementation((_, routeId: RouteId | null) => map[routeId!] || null)
}

function getMapSearchPanel() {
  return screen.getByRole("generic", {
    name: /map search panel/i,
  })
}

beforeAll(() => {
  mockUsePanelState()
  mockTileUrls()
})

beforeEach(() => {
  jest.mocked(getTestGroups).mockReturnValue([])
  mockScreenSize("desktop")
})

describe("<MapPage />", () => {
  describe("Snapshot", () => {
    test("renders the null state", () => {
      mockVehicleSearchResultsCategory(null)
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

    test("Has the layers control", () => {
      mockVehicleSearchResultsCategory([])
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
      expect(layersControlButton.get()).toBeInTheDocument()
    })

    test("renders the empty state", () => {
      mockVehicleSearchResultsCategory([])
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

  test("renders nearby stations on zoom = 15", async () => {
    setHtmlWidthHeightForLeafletMap()
    ;(useAllStops as jest.Mock).mockReturnValue([
      // 2 stations at map center which should be visible
      stopFactory.build({
        locationType: LocationType.Station,
      }),
      stopFactory.build({
        locationType: LocationType.Station,
      }),
      // 1 station not near center which should not be visible
      stopFactory.build({
        locationType: LocationType.Station,
        lat: 42.0,
        lon: -71.0,
      }),
      // 1 stop near center which should not be visible
      stopFactory.build({
        locationType: LocationType.Stop,
      }),
    ])

    const { container } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <MapPage />
      </StateDispatchProvider>
    )

    expect(getAllStationIcons(container)).toHaveLength(0)
    expect(getAllStopIcons(container)).toHaveLength(0)

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(2)
    expect(getAllStopIcons(container)).toHaveLength(0)
  })

  test("renders all nearby stops and stations only on zoom = 17", async () => {
    setHtmlWidthHeightForLeafletMap()
    ;(useAllStops as jest.Mock).mockReturnValue([
      // 2 stations at map center which should be visible
      stopFactory.build({
        locationType: LocationType.Station,
      }),
      stopFactory.build({
        locationType: LocationType.Station,
      }),
      // 1 station not near center which should not be visible
      stopFactory.build({
        locationType: LocationType.Station,
        lat: 42.0,
        lon: -71.0,
      }),
      // 1 stop near center which should  be visible
      stopFactory.build({
        locationType: LocationType.Stop,
      }),
      // 1 stop not near center which should not be visible
      stopFactory.build({
        locationType: LocationType.Stop,
        lat: 41.0,
        lon: -72.0,
      }),
    ])

    const { container } = render(
      <StateDispatchProvider state={stateFactory.build()} dispatch={jest.fn()}>
        <MapPage />
      </StateDispatchProvider>
    )

    expect(getAllStationIcons(container)).toHaveLength(0)
    expect(getAllStopIcons(container)).toHaveLength(0)

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(2)
    expect(getAllStopIcons(container)).toHaveLength(1)
  })

  test("clicking a vehicle on the map, should set vehicle as new selection", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
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
    mockVehicleSearchResultsCategory(vehicles)

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
    expect(mockedFSEvent).toHaveBeenCalledWith("VPC Opened", {})
  })

  test("clicking a vehicle from a search result displays the route shape", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = "clickMe"
    const vehicle = vehicleFactory.build({ runId })
    mockVehicleSearchResultsCategory([vehicle])
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
    mockVehicleSearchResultsCategory([vehicle])
    const activeSearch = searchPageStateFactory.build({
      query: { text: runId, property: "run" },
      isActive: true,
      savedQueries: [],
    })

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

    await userEvent.click(searchFormSubmitButton.get())
    expect(
      container.querySelector(".c-vehicle-map__route-shape")
    ).not.toBeInTheDocument()
  })

  test("when a search is submitted, should fire FS event for map page", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    mockVehicleSearchResultsCategory([])
    const mockDispatch = jest.fn()

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: {
            query: { text: "123" },
            isActive: true,
          },
        })}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(searchFormSubmitButton.get())

    expect(mockedFSEvent).toHaveBeenCalledWith(
      "Search submitted from map page",
      {}
    )
  })

  test("when new search button is clicked, then the search query and map selection is cleared", async () => {
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

    mockVehicleSearchResultsCategory([vehicle])
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

    await userEvent.click(screen.getByRole("button", { name: /new search/i }))
    expect(screen.getByPlaceholderText("Search")).toHaveProperty("value", "")
    expect(
      container.querySelector(".c-vehicle-icon__label")
    ).not.toBeInTheDocument()
  })

  test("when back is clicked, and there is selection history, shows the previous selection", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = runIdFactory.build()
    const currentVehicle = vehicleFactory.build({ runId })
    const previousVehicle = vehicleFactory.build({
      runId: runIdFactory.build(),
    })

    const activeSearch: SearchPageState = searchPageStateFactory.build({
      query: searchQueryRunFactory.searchFor(currentVehicle.runId!).build(),
      selectedEntity: {
        type: SelectedEntityType.Vehicle,
        vehicleId: currentVehicle.id,
      },
      selectedEntityHistory: [
        { type: SelectedEntityType.Vehicle, vehicleId: previousVehicle.id },
      ],
    })

    mockVehicleSearchResultsCategory([currentVehicle, previousVehicle])
    mockUsePatternsByIdForVehicles([currentVehicle, previousVehicle])

    mockUseVehicleForId([currentVehicle, previousVehicle])

    mockUseVehiclesForRouteMap({
      [currentVehicle.routeId!]: [currentVehicle, previousVehicle],
    })

    render(
      <RealDispatchWrapper
        initialState={stateFactory.build({ searchPageState: activeSearch })}
      >
        <MapPage />
      </RealDispatchWrapper>
    )

    expect(vehiclePropertiesCard.get()).toHaveTextContent(currentVehicle.id)
    await userEvent.click(screen.getByRole("button", { name: /back/i }))
    expect(vehiclePropertiesCard.get()).toHaveTextContent(previousVehicle.id)
  })

  test("when back is clicked and there is no previous history, then the map is cleared but search is not", async () => {
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

    mockVehicleSearchResultsCategory([vehicle])
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

    await userEvent.click(screen.getByRole("button", { name: /back/i }))
    expect(screen.getByPlaceholderText("Search")).toHaveProperty(
      "value",
      vehicle.runId!
    )
    expect(
      container.querySelector(".c-vehicle-icon__label")
    ).not.toBeInTheDocument()
  })

  test("when there is no previous selection history or search query, then back button isn't shown", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const runId = runIdFactory.build()
    const vehicle = vehicleFactory.build({ runId })
    mockVehicleSearchResultsCategory([vehicle])
    mockUsePatternsByIdForVehicles([vehicle])
    mockUseVehicleForId([vehicle])
    mockUseVehiclesForRouteMap({
      [vehicle.routeId!]: [vehicle],
    })

    render(
      <RealDispatchWrapper
        initialState={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
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

    expect(
      screen.getByRole("generic", { name: /map search panel/i })
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /back/i })
    ).not.toBeInTheDocument()
  })

  test("When a vehicle is selected from the list of search results, then search panel should stay open and VPC visible", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const runId = runIdFactory.build()
    const vehicle = vehicleFactory.associations({ runId }).build()

    mockVehicleSearchResultsCategory([vehicle])
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
    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--visible")
  })

  test("When a vehicle is selected from the list of search results on mobile, then search panel should close", async () => {
    mockScreenSize("mobile")
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const runId = runIdFactory.build()
    const vehicle = vehicleFactory.associations({ runId }).build()

    mockVehicleSearchResultsCategory([vehicle])
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

    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--hidden")
  })

  test("When a route is selected, then search panel should stay open and RPC visible", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const route = routeFactory.build()
    const runId = runIdFactory.build()
    const vehicle = vehicleFactory
      .associations({ runId })
      .build({ routeId: route.id })

    mockVehicleSearchResultsCategory([vehicle])
    mockUseVehicleForId([vehicle])
    // mockUseVehiclesForRouteMap({ [vehicle.routeId!]: [vehicle] })

    const [routePattern1, routePattern2] = routePatternFactory.buildList(2, {
      routeId: vehicle.routeId!,
    })
    ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
      [routePattern1.id]: routePattern1,
      [routePattern2.id]: routePattern2,
    })

    render(
      <RoutesProvider routes={[route]}>
        <RealDispatchWrapper
          initialState={stateFactory.build({
            searchPageState: activeSearchPageStateFactory.build({
              query: { text: vehicle.runId! },
              selectedEntity: {
                type: SelectedEntityType.RoutePattern,
                routeId: route.id,
                routePatternId: routePattern1.id,
              },
            }),
          })}
        >
          <MapPage />
        </RealDispatchWrapper>
      </RoutesProvider>
    )

    expect(routePropertiesCard.get()).toBeVisible()
    expect(getMapSearchPanel()).toHaveClass(
      "c-map-page__input-and-results--visible"
    )
  })

  test("When a location is selected from the list of search results, location card should be visible", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const location = locationSearchResultFactory.build()

    ;(useLocationSearchResults as jest.Mock).mockReturnValue([location])

    const { container } = render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: activeSearchPageStateFactory.build({
            query: { text: location.name! },
            selectedEntity: {
              type: SelectedEntityType.Location,
              location: location,
            },
          }),
        })}
        dispatch={jest.fn()}
      >
        <MapPage />
      </StateDispatchProvider>
    )

    const mapSearchPanel = getMapSearchPanel()
    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--visible")

    const locationCard = screen.getByLabelText(location.name!)
    expect(locationCard).toBeVisible()

    // Selected location has street view button, whereas a location in the
    // results list does not
    expect(within(locationCard).getByText(/Street View/)).toBeInTheDocument()

    expect(screen.getByRole("button", { name: "New Search" })).toBeVisible()

    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--visible")

    expect(
      container.querySelector(
        ".leaflet-marker-pane .c-location-dot-icon--selected"
      )
    ).toBeVisible()
    expect(screen.getByTitle("Recenter Map")).toBeVisible()
  })

  test("When a location is selected from the list of search results on mobile, the drawer is not visible", async () => {
    mockScreenSize("mobile")
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const location = locationSearchResultFactory.build()

    ;(useLocationSearchResults as jest.Mock).mockReturnValue([location])

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: activeSearchPageStateFactory.build({
            query: { text: location.name! },
            selectedEntity: {
              type: SelectedEntityType.Location,
              location: location,
            },
          }),
        })}
        dispatch={jest.fn()}
      >
        <MapPage />
      </StateDispatchProvider>
    )

    const mapSearchPanel = getMapSearchPanel()
    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--hidden")
  })

  test("Locations selected by ID result in the location card being visible", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const location = locationSearchResultFactory.build()

    ;(useLocationSearchResultById as jest.Mock).mockImplementation((id) => {
      if (id === location.id) {
        return location
      }
      return null
    })

    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: activeSearchPageStateFactory.build({
            query: { text: location.name! },
            selectedEntity: {
              type: SelectedEntityType.LocationByPlaceId,
              placeId: location.id,
            },
          }),
        })}
        dispatch={jest.fn()}
      >
        <MapPage />
      </StateDispatchProvider>
    )

    const mapSearchPanel = getMapSearchPanel()
    expect(mapSearchPanel).toHaveClass("c-map-page__input-and-results--visible")

    const locationCard = screen.getByLabelText(location.name!)
    expect(locationCard).toBeVisible()
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

  test("when the search panel is collapsed, clicking a vehicle reopens it", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const route = routeFactory.build()
    const routeVehicleFactory = vehicleFactory.params({ routeId: route.id })
    const vehicle = routeVehicleFactory.build({ runId: runIdFactory.build() })
    mockVehicleSearchResultsCategory([vehicle])

    mockUsePatternsByIdForVehicles([vehicle])

    mockUseVehicleForId([vehicle])
    mockUseVehiclesForRouteMap({ [route.id]: [vehicle] })

    const mockDispatch = jest.fn()
    const state = stateFactory.build({
      searchPageState: searchPageStateFactory.build({
        selectedEntity: {
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        },
      }),
    })

    render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: "Collapse" }))

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "c-map-page__input-and-results--hidden"
    )

    await userEvent.click(
      within(document.getElementById("id-vehicle-map")!).getByRole("button", {
        name: vehicle.runId!,
      })
    )

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "c-map-page__input-and-results--visible"
    )
  })

  test("when the search panel is collapsed on mobile, clicking a vehicle reopens it", async () => {
    mockScreenSize("mobile")
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const route = routeFactory.build()
    const routeVehicleFactory = vehicleFactory.params({ routeId: route.id })
    const vehicle = routeVehicleFactory.build({ runId: runIdFactory.build() })
    mockVehicleSearchResultsCategory([vehicle])

    mockUsePatternsByIdForVehicles([vehicle])

    mockUseVehicleForId([vehicle])
    mockUseVehiclesForRouteMap({ [route.id]: [vehicle] })

    const mockDispatch = jest.fn()
    const state = stateFactory.build({
      searchPageState: searchPageStateFactory.build({
        selectedEntity: {
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        },
      }),
    })

    render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <BrowserRouter>
          <MapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "c-map-page__input-and-results--hidden"
    )

    await userEvent.click(
      within(document.getElementById("id-vehicle-map")!).getByRole("button", {
        name: vehicle.runId!,
      })
    )

    expect(screen.getByRole("generic", { name: /search panel/i })).toHaveClass(
      "c-map-page__input-and-results--visible"
    )
  })

  test("clicking a run from a selected vehicle opens properties panel with run", async () => {
    const mockedUsePanelState = mockUsePanelState()

    const route = routeFactory.build()
    const routeVehicleFactory = vehicleFactory.params({ routeId: route.id })
    const runId = "test-run"
    const vehicle = routeVehicleFactory.build({ runId })

    jest
      .mocked(useMinischeduleRun)
      .mockReturnValue(
        RunFactory.build({ id: runId, activities: [pieceFactory.build()] })
      )

    mockVehicleSearchResultsCategory([vehicle])

    mockUsePatternsByIdForVehicles([vehicle])

    mockUseVehicleForId([vehicle])
    mockUseVehiclesForRouteMap({ [route.id]: [vehicle] })

    const mockDispatch = jest.fn()
    const state = stateFactory.build({
      searchPageState: searchPageStateFactory.build({
        selectedEntity: {
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        },
      }),
    })

    render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <RoutesProvider routes={[route]}>
          <BrowserRouter>
            <MapPage />
          </BrowserRouter>
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: runId }))

    expect(
      mockedUsePanelState().openVehiclePropertiesPanel
    ).toHaveBeenCalledWith(vehicle, "run")
  })

  describe("<VehiclePropertiesCard />", () => {
    describe("renders", () => {
      test("after search result is selected", async () => {
        jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
        const vehicle = vehicleFactory.build({})
        mockVehicleSearchResultsCategory([vehicle])
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

        mockVehicleSearchResultsCategory([vehicle])
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
    test("when VehiclePropertiesCard Route Button is clicked, should replace VPC with the associated route's RPC", async () => {
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

      fireEvent.click(
        getByRole(vehiclePropertiesCard.get(), "button", {
          name: "Route Variant Name",
        })
      )
      await waitFor(() => expect(routePropertiesCard.get()).toBeVisible())
      expect(vehiclePropertiesCard.query()).not.toBeInTheDocument()
    })

    test("when VehiclePropertiesCard Route Button is clicked, follower should be initially disabled", async () => {
      const route = routeFactory.build()
      const routePattern = routePatternFactory.build({ routeId: route.id })
      const vehicle = vehicleFactory.build({
        routeId: routePattern.routeId,
        routePatternId: routePattern.id,
      })

      mockUseVehicleForId([vehicle])
      mockUseVehiclesForRouteMap({
        [vehicle.routeId]: [vehicle],
      })
      jest.mocked(usePatternsByIdForRoute).mockReturnValue({
        [routePattern.id]: routePattern,
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
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </RealDispatchWrapper>
      )

      await userEvent.click(
        getByRole(vehiclePropertiesCard.get(), "button", {
          name: "Route Variant Name",
        })
      )

      expect(recenterControl.get().dataset.isActive).toBe("false")
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

        const searchInput = searchFormSearchInput.get()
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

        mockVehicleSearchResultsCategory(vehicles)
        mockUsePatternsByIdForVehicles([vehicle])

        render(
          <StateDispatchProvider
            state={stateFactory.build({ searchPageState })}
            dispatch={changeApplicationState}
          >
            <MapPage />
          </StateDispatchProvider>
        )

        const searchInput = searchFormSearchInput.get()
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

        mockVehicleSearchResultsCategory(vehicles)

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
          within(document.getElementById("id-vehicle-map")!).getAllByRole(
            "button",
            { name: runIdToLabel(vehicle.runId!) }
          )
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
            within(document.getElementById("id-vehicle-map")!).getAllByRole(
              "button",
              { name: selectedVehicle.runId! }
            )
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
              within(document.getElementById("id-vehicle-map")!).getAllByRole(
                "button",
                { name: selectedVehicle.runId! }
              )
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

    describe("Map controls", () => {
      test("Can change tile layer to satellite", async () => {
        const { container } = render(
          <RealDispatchWrapper>
            <MapPage />
          </RealDispatchWrapper>
        )

        await userEvent.click(layersControlButton.get())

        await userEvent.click(screen.getByLabelText("Satellite"))

        expect(
          container.querySelector("img[src^=test_satellite_url")
        ).not.toBeNull()
      })
    })
  })

  test("can see search results grouped by property", () => {
    render(
      <StateDispatchProvider
        state={stateFactory.build({
          searchPageState: searchPageStateFactory.build({
            query: { text: "123" },
            isActive: true,
          }),
        })}
        dispatch={jest.fn()}
      >
        <MapPage />
      </StateDispatchProvider>
    )

    expect(screen.getByLabelText("Grouped Search Results")).toBeInTheDocument()
  })

  describe("detours entrypoint", () => {
    test("shows the detour dropdown on right-click", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      jest
        .spyOn(dateTime, "now")
        .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

      jest.spyOn(Date, "now").mockImplementation(() => 234000)

      jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

      const route = routeFactory.build()
      const runId = runIdFactory.build()

      const selectedVehicle = randomLocationVehicle.build({
        routeId: route.id,
        runId: runId,
      })

      setHtmlWidthHeightForLeafletMap()
      mockUseVehicleForId([selectedVehicle])
      mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
      mockUsePatternsByIdForVehicles([selectedVehicle], {
        stopCount: 8,
      })

      const { container } = render(
        <StateDispatchProvider
          state={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicle.id,
              },
            },
          })}
          dispatch={jest.fn()}
        >
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )

      await userEvent.pointer({
        keys: "[MouseRight>]",
        target: within(container.querySelector("#id-vehicle-map")!).getByRole(
          "button",
          {
            name: runId!,
          }
        ),
      })

      expect(
        screen.getByRole("button", {
          name: `Start a detour on route ${route.name}`,
        })
      ).toBeVisible()
    })

    test("does not show the detour dropdown if the user isn't in the right test group", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      jest
        .spyOn(dateTime, "now")
        .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

      jest.spyOn(Date, "now").mockImplementation(() => 234000)

      jest.mocked(getTestGroups).mockReturnValue([])

      const route = routeFactory.build()
      const runId = runIdFactory.build()

      const selectedVehicle = randomLocationVehicle.build({
        routeId: route.id,
        runId: runId,
      })

      setHtmlWidthHeightForLeafletMap()
      mockUseVehicleForId([selectedVehicle])
      mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
      mockUsePatternsByIdForVehicles([selectedVehicle], {
        stopCount: 8,
      })

      const { container } = render(
        <StateDispatchProvider
          state={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicle.id,
              },
            },
          })}
          dispatch={jest.fn()}
        >
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )

      await userEvent.pointer({
        keys: "[MouseRight>]",
        target: within(container.querySelector("#id-vehicle-map")!).getByRole(
          "button",
          {
            name: runId!,
          }
        ),
      })

      expect(
        screen.queryByRole("button", {
          name: `Start a detour on route ${route.name}`,
        })
      ).not.toBeInTheDocument()
    })

    test("shows the detour modal when the user clicks on the detour dropdown", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      jest
        .spyOn(dateTime, "now")
        .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

      jest.spyOn(Date, "now").mockImplementation(() => 234000)

      jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

      const route = routeFactory.build()
      const runId = runIdFactory.build()

      const selectedVehicle = randomLocationVehicle.build({
        routeId: route.id,
        runId: runId,
      })

      setHtmlWidthHeightForLeafletMap()
      mockUseVehicleForId([selectedVehicle])
      mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
      mockUsePatternsByIdForVehicles([selectedVehicle], {
        stopCount: 8,
      })

      const { container } = render(
        <StateDispatchProvider
          state={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicle.id,
              },
            },
          })}
          dispatch={jest.fn()}
        >
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )

      await userEvent.pointer({
        keys: "[MouseRight>]",
        target: within(container.querySelector("#id-vehicle-map")!).getByRole(
          "button",
          {
            name: runId!,
          }
        ),
      })

      await userEvent.click(
        screen.getByRole("button", {
          name: `Start a detour on route ${route.name}`,
        })
      )

      expect(screen.getByText("Create Detour")).toBeVisible()
    })

    test("dismisses the detour modal on escape key", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      jest
        .spyOn(dateTime, "now")
        .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

      jest.spyOn(Date, "now").mockImplementation(() => 234000)

      jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

      const route = routeFactory.build()
      const runId = runIdFactory.build()

      const selectedVehicle = randomLocationVehicle.build({
        routeId: route.id,
        runId: runId,
      })

      setHtmlWidthHeightForLeafletMap()
      mockUseVehicleForId([selectedVehicle])
      mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
      mockUsePatternsByIdForVehicles([selectedVehicle], {
        stopCount: 8,
      })

      const { container } = render(
        <StateDispatchProvider
          state={stateFactory.build({
            searchPageState: {
              selectedEntity: {
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicle.id,
              },
            },
          })}
          dispatch={jest.fn()}
        >
          <RoutesProvider routes={[route]}>
            <MapPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )

      await userEvent.pointer({
        keys: "[MouseRight>]",
        target: within(container.querySelector("#id-vehicle-map")!).getByRole(
          "button",
          {
            name: runId!,
          }
        ),
      })

      await userEvent.click(
        screen.getByRole("button", {
          name: `Start a detour on route ${route.name}`,
        })
      )

      await userEvent.keyboard("{Escape}")

      expect(container.querySelector(".c-detour-modal")).not.toBeInTheDocument()
    })
  })
})
