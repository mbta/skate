import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import userEvent from "@testing-library/user-event"

import MapDisplay from "../../../src/components/mapPage/mapDisplay"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import usePatternsByIdForRoute from "../../../src/hooks/usePatternsByIdForRoute"
import { useRouteShapes } from "../../../src/hooks/useShapes"
import useVehicleForId from "../../../src/hooks/useVehicleForId"
import useVehiclesForRoute from "../../../src/hooks/useVehiclesForRoute"
import usePullbackVehicles from "../../../src/hooks/usePullbackVehicles"
import { LocationType, RouteType } from "../../../src/models/stopData"
import {
  Ghost,
  Vehicle,
  VehicleId,
  VehicleInScheduledService,
} from "../../../src/realtime"
import { RouteId } from "../../../src/schedule"
import { SelectedEntityType } from "../../../src/state/searchPageState"
import { streetViewUrl } from "../../../src/util/streetViewUrl"

import ghostFactory from "../../factories/ghost"
import routeFactory from "../../factories/route"
import { routePatternFactory } from "../../factories/routePattern"
import { runIdFactory } from "../../factories/run"
import stopFactory from "../../factories/stop"
import vehicleFactory, {
  randomLocationVehicle,
  shuttleFactory,
} from "../../factories/vehicle"

import { setHtmlWidthHeightForLeafletMap } from "../../testHelpers/leafletMapWidth"
import {
  mockScreenSize,
  mockUsePatternsByIdForVehicles,
} from "../../testHelpers/mockHelpers"

import shapeFactory from "../../factories/shape"
import { zoomInButton } from "../../testHelpers/selectors/components/map"
import { stopIcon } from "../../testHelpers/selectors/components/map/markers/stopIcon"
import { routePropertiesCard } from "../../testHelpers/selectors/components/mapPage/routePropertiesCard"
import { vehiclePropertiesCard } from "../../testHelpers/selectors/components/mapPage/vehiclePropertiesCard"
import locationSearchResultFactory from "../../factories/locationSearchResult"
import { useAllStops } from "../../../src/hooks/useAllStops"
import {
  getAllStationIcons,
  getAllStopIcons,
} from "../../testHelpers/selectors/components/mapPage/map"
import { fullStoryEvent } from "../../../src/helpers/fullStory"
import { recenterControl } from "../../testHelpers/selectors/components/map/controls/recenterControl"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../../src/hooks/usePatternsByIdForRoute", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => {
    return {
      is_loading: true,
    }
  }),
}))

jest.mock("../../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/usePullbackVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useVehiclesForRoute", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useAllStops", () => ({
  __esModule: true,
  useAllStops: jest.fn(() => []),
}))

jest.mock("../../../src/hooks/useShapes", () => ({
  __esModule: true,
  useRouteShapes: jest.fn(() => []),
}))

jest.mock("../../../src/helpers/fullStory")

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
  mockScreenSize("desktop")
})

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

function mockUsePullbackVehicles(vehicles: Vehicle[]) {
  ;(
    usePullbackVehicles as jest.Mock<typeof usePullbackVehicles>
  ).mockImplementation(() => vehicles)
}

describe("<MapDisplay />", () => {
  test("renders nearby stations only on zoom = 15", async () => {
    setHtmlWidthHeightForLeafletMap()
    ;(useAllStops as jest.Mock).mockReturnValue([
      // 2 stations at map center should be visible
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
      <MapDisplay
        selectedEntity={null}
        setSelection={jest.fn()}
        fetchedSelectedLocation={null}
      />
    )

    expect(getAllStationIcons(container)).toHaveLength(0)
    expect(getAllStopIcons(container)).toHaveLength(0)

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(2)
    expect(getAllStopIcons(container)).toHaveLength(0)
  })

  test("renders all nearby stations and bus stops only on zoom = 17", async () => {
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
      // 1 subway near center which should not be visible
      stopFactory.build({
        locationType: LocationType.Stop,
        vehicleType: RouteType.Subway,
      }),
      // 1 stop not near center which should not be visible
      stopFactory.build({
        locationType: LocationType.Stop,
        lat: 41.0,
        lon: -72.0,
      }),
    ])

    const { container } = render(
      <MapDisplay
        selectedEntity={null}
        setSelection={jest.fn()}
        fetchedSelectedLocation={null}
      />
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

  test("when zoomed in to see nearby stop and a vehicle is selected, only renders stops on that vehicle's route pattern once", async () => {
    setHtmlWidthHeightForLeafletMap()

    const stop = stopFactory.build({
      locationType: LocationType.Stop,
    })

    const route = routeFactory.build()

    const routePattern = routePatternFactory.build({
      routeId: route.id,
      shape: shapeFactory.build({ stops: [stop] }),
    })

    const selectedVehicle = randomLocationVehicle.build({
      routeId: route.id,
      runId: runIdFactory.build(),
      routePatternId: routePattern.id,
    })

    mockUseVehicleForId([selectedVehicle])
    mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
    ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
      [routePattern.id]: routePattern,
    })
    ;(useAllStops as jest.Mock).mockReturnValue([stop])

    const { container } = render(
      <MapDisplay
        selectedEntity={{
          type: SelectedEntityType.Vehicle,
          vehicleId: selectedVehicle.id,
        }}
        setSelection={jest.fn()}
        fetchedSelectedLocation={null}
      />
    )

    expect(getAllStopIcons(container)).toHaveLength(1)

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStopIcons(container)).toHaveLength(1)
  })

  test("when zoomed in to see nearby stop and a route pattern is selected, only renders stops on that route pattern once", async () => {
    setHtmlWidthHeightForLeafletMap()

    const stop = stopFactory.build({
      locationType: LocationType.Stop,
    })

    const route = routeFactory.build()
    const routePattern = routePatternFactory.build({
      routeId: route.id,
      shape: shapeFactory.build({ stops: [stop] }),
    })

    ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
      [routePattern.id]: routePattern,
    })
    ;(useAllStops as jest.Mock).mockReturnValue([stop])

    const { container } = render(
      <MapDisplay
        selectedEntity={{
          type: SelectedEntityType.RoutePattern,
          routeId: route.id,
          routePatternId: routePattern.id,
        }}
        setSelection={jest.fn()}
        fetchedSelectedLocation={null}
      />
    )

    expect(getAllStopIcons(container)).toHaveLength(1)

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStopIcons(container)).toHaveLength(1)
  })

  test("clicking a vehicle on the map, should set vehicle as new selection", async () => {
    const route = routeFactory.build()
    const routeVehicleFactory = vehicleFactory.params({ routeId: route.id })
    const vehicles = [
        routeVehicleFactory.build({ runId: runIdFactory.build() }),
        routeVehicleFactory.build({ runId: runIdFactory.build() }),
        ...routeVehicleFactory.buildList(3),
      ],
      [vehicle, nextVehicle] = vehicles,
      { runId } = nextVehicle

    mockUsePatternsByIdForVehicles([vehicle, nextVehicle])

    mockUseVehicleForId([vehicle, nextVehicle])
    mockUseVehiclesForRouteMap({ [route.id]: vehicles })

    const mockSetSelection = jest.fn()
    render(
      <MapDisplay
        selectedEntity={{
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        }}
        setSelection={mockSetSelection}
        fetchedSelectedLocation={null}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: runId! }))

    expect(mockSetSelection).toHaveBeenCalledWith({
      type: SelectedEntityType.Vehicle,
      vehicleId: nextVehicle.id,
    })
  })

  test("clicking a vehicle that is already selected still calls setSelection", async () => {
    const route = routeFactory.build()
    const routeVehicleFactory = vehicleFactory.params({ routeId: route.id })
    const vehicles = [
        routeVehicleFactory.build({ runId: runIdFactory.build() }),
        routeVehicleFactory.build({ runId: runIdFactory.build() }),
        ...routeVehicleFactory.buildList(3),
      ],
      [vehicle, nextVehicle] = vehicles

    mockUsePatternsByIdForVehicles([vehicle, nextVehicle])

    mockUseVehicleForId([vehicle, nextVehicle])
    mockUseVehiclesForRouteMap({ [route.id]: vehicles })

    const mockSetSelection = jest.fn()
    render(
      <MapDisplay
        selectedEntity={{
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicle.id,
        }}
        setSelection={mockSetSelection}
        fetchedSelectedLocation={null}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: vehicle.runId! }))

    expect(mockSetSelection).toHaveBeenCalledWith({
      type: SelectedEntityType.Vehicle,
      vehicleId: vehicle.id,
    })
  })

  describe("showSelectionCard", () => {
    test("when showSelectionCard is false, vehicle properties card should not be visible", async () => {
      setHtmlWidthHeightForLeafletMap()

      const vehicles = randomLocationVehicle.buildList(3),
        [vehicle] = vehicles

      mockUseVehicleForId(vehicles)
      mockUseVehiclesForRouteMap({ [vehicle.routeId!]: vehicles })
      mockUsePatternsByIdForVehicles([vehicle])

      const setSelectedEntityMock = jest.fn()

      const { container } = render(
        <MapDisplay
          selectedEntity={{
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicle.id,
          }}
          setSelection={setSelectedEntityMock}
          fetchedSelectedLocation={null}
        />
      )

      const routeShape = container.querySelector(".c-vehicle-map__route-shape")
      expect(routeShape).toBeVisible()
      expect(vehiclePropertiesCard.query()).not.toBeInTheDocument()
    })
  })

  describe("when rendering the map", () => {
    describe("with an active selection", () => {
      describe("and selection is a vehicle", () => {
        describe("and vehicle is a regular bus", () => {
          test("should display: vehicle icon, route shape and stops", () => {
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
              <MapDisplay
                selectedEntity={{
                  type: SelectedEntityType.Vehicle,
                  vehicleId: selectedVehicle.id,
                }}
                setSelection={jest.fn()}
                fetchedSelectedLocation={null}
              />
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

          test("right-clicking brings up the detour dropdown menu", async () => {
            jest
              .mocked(getTestGroups)
              .mockReturnValue([TestGroups.DetoursPilot])

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

            render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={jest.fn()}
                  fetchedSelectedLocation={null}
                />
              </RoutesProvider>
            )

            await userEvent.pointer({
              keys: "[MouseRight>]",
              target: screen.getByText(runId),
            })

            expect(
              screen.getByRole("button", {
                name: `Start a detour on route ${route.name}`,
              })
            ).toBeVisible()
          })

          test("right-clicking does not bring up the detour dropdown if the user isn't a member of the test group", async () => {
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

            render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={jest.fn()}
                  fetchedSelectedLocation={null}
                />
              </RoutesProvider>
            )

            await userEvent.pointer({
              keys: "[MouseRight>]",
              target: screen.getByText(runId),
            })

            expect(
              screen.queryByRole("button", {
                name: `Start a detour on route ${route.name}`,
              })
            ).not.toBeInTheDocument()
          })

          test("right-clicking does not bring up the detour dropdown on mobile", async () => {
            jest
              .mocked(getTestGroups)
              .mockReturnValue([TestGroups.DetoursPilot])
            mockScreenSize("mobile")

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

            render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={jest.fn()}
                  fetchedSelectedLocation={null}
                />
              </RoutesProvider>
            )

            await userEvent.pointer({
              keys: "[MouseRight>]",
              target: screen.getByText(runId),
            })

            expect(
              screen.queryByRole("button", {
                name: `Start a detour on route ${route.name}`,
              })
            ).not.toBeInTheDocument()
          })
        })

        test("and vehicle is a shuttle; should display: vehicle icon, but not route shape or stops", () => {
          const selectedVehicle = shuttleFactory.build()

          setHtmlWidthHeightForLeafletMap()
          mockUseVehiclesForRouteMap({})
          mockUseVehicleForId([selectedVehicle])
          mockUsePatternsByIdForVehicles([]) // no route pattern for shuttle vehicle

          const { container } = render(
            <MapDisplay
              selectedEntity={{
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicle.id,
              }}
              setSelection={jest.fn()}
              fetchedSelectedLocation={null}
            />
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
        })
      })

      describe("selection is a ghost", () => {
        test("the map should be unpopulated and centered on default location", () => {
          const ghost = ghostFactory.build()
          mockUseVehicleForId([ghost])
          mockUseVehiclesForRouteMap({ [ghost.routeId!]: [ghost] })

          render(
            <MapDisplay
              selectedEntity={{
                type: SelectedEntityType.Vehicle,
                vehicleId: ghost.id,
              }}
              setSelection={jest.fn()}
              fetchedSelectedLocation={null}
            />
          )

          expect(
            screen.queryAllByRole("button", { name: /^run/ })
          ).toHaveLength(0)
        })
      })

      describe("selection is a route pattern", () => {
        test("RPC doesn't display if route data hasn't loaded yet", () => {
          setHtmlWidthHeightForLeafletMap()

          const route = routeFactory.build()
          const vehicles = randomLocationVehicle.buildList(3)

          mockUseVehiclesForRouteMap({ [route.id]: vehicles })
          const routePattern = routePatternFactory.build({ routeId: route.id })
          ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
            [routePattern.id]: routePattern,
          })

          render(
            <RoutesProvider routes={[]}>
              <MapDisplay
                selectedEntity={{
                  type: SelectedEntityType.RoutePattern,
                  routeId: route.id,
                  routePatternId: routePattern.id,
                }}
                setSelection={jest.fn()}
                fetchedSelectedLocation={null}
              />
            </RoutesProvider>
          )

          expect(routePropertiesCard.query()).not.toBeInTheDocument()
        })

        test("RPC doesn't display if selected pattern ID doesn't match the route patterns", () => {
          setHtmlWidthHeightForLeafletMap()

          const route = routeFactory.build()
          const vehicles = randomLocationVehicle.buildList(3)

          mockUseVehiclesForRouteMap({ [route.id]: vehicles })
          const routePattern = routePatternFactory.build({ routeId: route.id })
          ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
            [routePattern.id]: routePattern,
          })
          render(
            <RoutesProvider routes={[route]}>
              <MapDisplay
                selectedEntity={{
                  type: SelectedEntityType.RoutePattern,
                  routeId: route.id,
                  routePatternId: "otherRoutePatternId",
                }}
                setSelection={jest.fn()}
                fetchedSelectedLocation={null}
              />
            </RoutesProvider>
          )

          expect(routePropertiesCard.query()).not.toBeInTheDocument()
        })
      })

      describe("selection is a location", () => {
        test("should display location marker", () => {
          setHtmlWidthHeightForLeafletMap()

          const location = locationSearchResultFactory.build({
            name: "Location Name",
          })

          const { container } = render(
            <MapDisplay
              selectedEntity={{
                type: SelectedEntityType.Location,
                location: location,
              }}
              setSelection={jest.fn()}
              fetchedSelectedLocation={null}
            />
          )

          expect(
            container.querySelectorAll(".c-location-dot-icon")
          ).toHaveLength(1)
        })

        test("should display location marker if location is fetched separately from autocomplete", () => {
          setHtmlWidthHeightForLeafletMap()

          const location = locationSearchResultFactory.build({
            name: "Location Name",
          })

          const { container } = render(
            <MapDisplay
              selectedEntity={{
                type: SelectedEntityType.LocationByPlaceId,
                placeId: location.id,
              }}
              setSelection={jest.fn()}
              fetchedSelectedLocation={location}
            />
          )

          expect(
            container.querySelectorAll(".c-location-dot-icon")
          ).toHaveLength(1)
        })
      })
    })

    describe("pull-back data layer", () => {
      test("renders vehicles", async () => {
        setHtmlWidthHeightForLeafletMap()

        const pullBackVehicle = vehicleFactory.build({
          endOfTripType: "pull_back",
        })

        mockUsePullbackVehicles([pullBackVehicle])

        render(
          <MapDisplay
            selectedEntity={null}
            setSelection={jest.fn()}
            fetchedSelectedLocation={null}
          />
        )

        await userEvent.click(screen.getByRole("button", { name: "Layers" }))
        await userEvent.click(
          screen.getByRole("switch", { name: "Show pull-backs" })
        )

        expect(screen.getAllByRole("button", { name: "Pull-B" })).toHaveLength(
          1
        )
      })

      test("if a pulling back vehicle is selected, doesn't render it again in pull-backs layer", async () => {
        setHtmlWidthHeightForLeafletMap()

        const [pullBackVehicle1, pullBackVehicle2] = vehicleFactory.buildList(
          2,
          {
            endOfTripType: "pull_back",
          }
        )

        mockUsePullbackVehicles([pullBackVehicle1, pullBackVehicle2])
        mockUseVehicleForId([pullBackVehicle1])
        mockUseVehiclesForRouteMap({
          [pullBackVehicle1.routeId]: [pullBackVehicle1],
        })
        mockUsePatternsByIdForVehicles([pullBackVehicle1], {
          stopCount: 8,
        })

        render(
          <MapDisplay
            selectedEntity={{
              type: SelectedEntityType.Vehicle,
              vehicleId: pullBackVehicle1.id,
            }}
            setSelection={jest.fn()}
            fetchedSelectedLocation={null}
          />
        )

        await userEvent.click(screen.getByRole("button", { name: "Layers" }))
        await userEvent.click(
          screen.getByRole("switch", { name: "Show pull-backs" })
        )

        expect(screen.getAllByRole("button", { name: "Pull-B" })).toHaveLength(
          2
        )
      })

      test("can click to select a vehicle", async () => {
        const mockSetSelection = jest.fn()

        setHtmlWidthHeightForLeafletMap()

        const pullBackVehicle = vehicleFactory.build({
          endOfTripType: "pull_back",
        })

        mockUsePullbackVehicles([pullBackVehicle])

        render(
          <MapDisplay
            selectedEntity={null}
            setSelection={mockSetSelection}
            fetchedSelectedLocation={null}
          />
        )

        await userEvent.click(screen.getByRole("button", { name: "Layers" }))
        await userEvent.click(
          screen.getByRole("switch", { name: "Show pull-backs" })
        )
        await userEvent.click(screen.getByRole("button", { name: "Pull-B" }))

        expect(mockSetSelection).toHaveBeenCalledWith({
          type: SelectedEntityType.Vehicle,
          vehicleId: pullBackVehicle.id,
        })
      })
    })
  })

  describe("when street view is enabled", () => {
    test("when a vehicle is clicked, should open street view at vehicle location", async () => {
      const mockedFSEvent = jest.mocked(fullStoryEvent)
      const mockSetSelection = jest.fn()
      const openSpy = jest
        .spyOn(window, "open")
        .mockImplementation(jest.fn<typeof window.open>())

      const latitude = 0
      const longitude = 0
      const bearing = 0

      const { id: routeId } = routeFactory.build()
      const vehicle = vehicleFactory.build({
        runId: runIdFactory.build(),
        routeId,
        latitude,
        longitude,
        bearing,
      })

      mockUseVehicleForId([vehicle])
      mockUseVehiclesForRouteMap({ [routeId]: [vehicle] })
      mockUsePatternsByIdForVehicles([vehicle])

      render(
        <MapDisplay
          selectedEntity={{
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicle.id,
          }}
          setSelection={mockSetSelection}
          streetViewInitiallyEnabled
          fetchedSelectedLocation={null}
        />
      )

      await userEvent.click(
        screen.getByRole("button", { name: vehicle.runId! })
      )

      const expectedStreetViewUrl = streetViewUrl({
        latitude,
        longitude,
        bearing,
      })
      expect(mockedFSEvent).toHaveBeenCalledWith(
        "User clicked map vehicle to open street view",
        {
          clickedMapAt: {
            bearing_real: bearing,
            latitude_real: latitude,
            longitude_real: longitude,
          },
          streetViewUrl_str: expectedStreetViewUrl,
        }
      )
      expect(openSpy).toHaveBeenCalledWith(expectedStreetViewUrl, "_blank")
      expect(mockSetSelection).not.toHaveBeenCalled()
    })

    test("when a bus stop is clicked, should open street view at bus stop location", async () => {
      const mockedFSEvent = jest.mocked(fullStoryEvent)
      setHtmlWidthHeightForLeafletMap()
      mockUseVehicleForId([])
      mockUseVehiclesForRouteMap({})
      const mockSetSelection = jest.fn()
      const openSpy = jest
        .spyOn(window, "open")
        .mockImplementation(jest.fn<typeof window.open>())

      const latitude = 0
      const longitude = 0

      // Add a stop to the map
      const shape = shapeFactory.build({
        stops: [
          stopFactory.build({
            lat: latitude,
            lon: longitude,
          }),
        ],
      })
      ;(useRouteShapes as jest.Mock).mockReturnValue([shape])

      // Ensure shape and stop are associated with selected route
      const route = routeFactory.build()
      ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
        [route.id]: routePatternFactory.build({
          shape: shape,
        }),
      })

      // Render map with route selected and street view enabled
      const { container } = render(
        <MapDisplay
          selectedEntity={{
            type: SelectedEntityType.RoutePattern,
            routeId: route.id,
            routePatternId: route.id,
          }}
          setSelection={mockSetSelection}
          streetViewInitiallyEnabled
          fetchedSelectedLocation={null}
        />
      )

      // Click Stop Marker while in street view mode
      fireEvent.click(stopIcon.get(container))

      const expectedStreetViewUrl = streetViewUrl({
        latitude,
        longitude,
      })

      expect(mockedFSEvent).toHaveBeenCalledWith(
        "User clicked map bus stop to open street view",
        {
          clickedMapAt: {
            latitude_real: latitude,
            longitude_real: longitude,
          },
          streetViewUrl_str: expectedStreetViewUrl,
        }
      )
      expect(openSpy).toHaveBeenCalledWith(expectedStreetViewUrl, "_blank")
      expect(mockSetSelection).not.toHaveBeenCalled()
    })
  })

  test.each([
    { enabled: true, expected: "true" },
    { enabled: false, expected: "false" },
  ])(
    "when initializeRouteFollowerEnabled is $enabled and route is selected, follower enabled state should be $expected",
    ({ enabled, expected }) => {
      setHtmlWidthHeightForLeafletMap()

      render(
        <MapDisplay
          selectedEntity={{
            type: SelectedEntityType.RoutePattern,
            routeId: "",
            routePatternId: "",
          }}
          fetchedSelectedLocation={null}
          setSelection={jest.fn()}
          initializeRouteFollowerEnabled={enabled}
        />
      )

      expect(recenterControl.get().dataset.isActive).toBe(expected)
    }
  )
})
