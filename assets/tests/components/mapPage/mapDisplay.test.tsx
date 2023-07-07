import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import React from "react"

import userEvent from "@testing-library/user-event"

import MapDisplay from "../../../src/components/mapPage/mapDisplay"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import usePatternsByIdForRoute from "../../../src/hooks/usePatternsByIdForRoute"
import { useStations } from "../../../src/hooks/useStations"
import useVehicleForId from "../../../src/hooks/useVehicleForId"
import useVehiclesForRoute from "../../../src/hooks/useVehiclesForRoute"
import { LocationType } from "../../../src/models/stopData"
import {
  Ghost,
  VehicleId,
  VehicleInScheduledService,
} from "../../../src/realtime"
import { RouteId } from "../../../src/schedule"
import { SelectedEntityType } from "../../../src/state/searchPageState"

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
import { mockUsePatternsByIdForVehicles } from "../../testHelpers/mockHelpers"

import { zoomInButton } from "../../testHelpers/selectors/components/map"
import { routePropertiesCard } from "../../testHelpers/selectors/components/mapPage/routePropertiesCard"
import { vehiclePropertiesCard } from "../../testHelpers/selectors/components/mapPage/vehiclePropertiesCard"

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

jest.mock("../../../src/hooks/useVehiclesForRoute", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

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

function getAllStationIcons(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(".c-station-icon")
}

describe("<MapDisplay />", () => {
  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockReturnValue(
      stopFactory.params({ locationType: LocationType.Station }).buildList(3)
    )

    const { container } = render(
      <MapDisplay selectedEntity={null} setSelection={jest.fn()} />
    )

    expect(getAllStationIcons(container)).toHaveLength(0)

    const zoomIn = zoomInButton.get()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(3)
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
              />
            </RoutesProvider>
          )

          expect(routePropertiesCard.query()).not.toBeInTheDocument()
        })
      })
    })
  })
})
