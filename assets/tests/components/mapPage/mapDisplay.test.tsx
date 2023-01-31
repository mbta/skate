import "@testing-library/jest-dom"
import { render, screen, within } from "@testing-library/react"
import React from "react"

import userEvent from "@testing-library/user-event"
import useVehicleForId from "../../../src/hooks/useVehicleForId"
import { useStations } from "../../../src/hooks/useStations"
import { LocationType } from "../../../src/models/stopData"
import { SelectedEntityType } from "../../../src/state/searchPageState"
import ghostFactory from "../../factories/ghost"
import { runIdFactory } from "../../factories/run"
import stopFactory from "../../factories/stop"
import vehicleFactory, {
  randomLocationVehicle,
  shuttleFactory,
} from "../../factories/vehicle"
import { setHtmlWidthHeightForLeafletMap } from "../../testHelpers/leafletMapWidth"
import useVehiclesForRoute from "../../../src/hooks/useVehiclesForRoute"
import routeFactory from "../../factories/route"
import { VehicleId, VehicleOrGhost } from "../../../src/realtime"
import { RouteId } from "../../../src/schedule"
import MapDisplay from "../../../src/components/mapPage/mapDisplay"
import { mockUserRoutePatternsByIdForVehicles } from "../../testHelpers/mockHelpers"

jest.mock("../../../src/hooks/useRoutePatternsById", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("../../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(),
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

function getMapZoomInButton(): Element {
  return screen.getByRole("button", { name: "Zoom in" })
}

function getAllStationIcons(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(".m-station-icon")
}

describe("<MapPage />", () => {
  test("renders stations on zoom", async () => {
    ;(useStations as jest.Mock).mockReturnValue(
      stopFactory.params({ locationType: LocationType.Station }).buildList(3)
    )

    const { container } = render(
      <MapDisplay
        selectedEntity={null}
        setSelection={jest.fn()}
        showSelectionCard={false}
      />
    )

    expect(getAllStationIcons(container)).toHaveLength(0)

    const zoomIn = getMapZoomInButton()
    await userEvent.click(zoomIn)
    await userEvent.click(zoomIn)

    expect(getAllStationIcons(container)).toHaveLength(3)
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

    mockUserRoutePatternsByIdForVehicles([vehicle, nextVehicle])

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
        showSelectionCard={false}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: runId! }))

    expect(mockSetSelection).toHaveBeenCalledWith({
      type: SelectedEntityType.Vehicle,
      vehicleId: nextVehicle.id,
    })
  })

  describe("showSelectionCard", () => {
    test("when showSelectionCard is false, vehicle properties card should not be visible", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      setHtmlWidthHeightForLeafletMap()

      const vehicles = randomLocationVehicle.buildList(3),
        [vehicle] = vehicles

      mockUseVehicleForId(vehicles)
      mockUseVehiclesForRouteMap({ [vehicle.routeId!]: vehicles })
      mockUserRoutePatternsByIdForVehicles([vehicle])

      const setSelectedEntityMock = jest.fn()

      const { container } = render(
        <MapDisplay
          selectedEntity={{
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicle.id,
          }}
          setSelection={setSelectedEntityMock}
          showSelectionCard={false}
        />
      )

      const routeShape = container.querySelector(".m-vehicle-map__route-shape")
      expect(routeShape).toBeVisible()
      expect(
        screen.queryByRole("generic", {
          name: /vehicle properties card/i,
        })
      ).not.toBeInTheDocument()
    })

    test("when showSelectionCard is true, vehicle properties card should be visible", async () => {
      jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
      setHtmlWidthHeightForLeafletMap()

      const vehicles = randomLocationVehicle.buildList(3),
        [vehicle] = vehicles

      mockUseVehicleForId(vehicles)
      mockUseVehiclesForRouteMap({ [vehicle.routeId!]: vehicles })
      mockUserRoutePatternsByIdForVehicles([vehicle])

      const setSelectedEntityMock = jest.fn()

      const { container } = render(
        <MapDisplay
          selectedEntity={{
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicle.id,
          }}
          setSelection={setSelectedEntityMock}
          showSelectionCard={true}
        />
      )

      const routeShape = container.querySelector(".m-vehicle-map__route-shape")

      expect(routeShape).toBeVisible()
      expect(getVehiclePropertiesCard()).toBeVisible()
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
            mockUserRoutePatternsByIdForVehicles([selectedVehicle], {
              stopCount: 8,
            })

            const { container } = render(
              <MapDisplay
                selectedEntity={{
                  type: SelectedEntityType.Vehicle,
                  vehicleId: selectedVehicle.id,
                }}
                setSelection={jest.fn()}
                showSelectionCard={false}
              />
            )

            expect(
              screen.getAllByRole("button", { name: selectedVehicle.runId! })
            ).toHaveLength(selectedRouteVehicles.length)

            expect(
              container.querySelectorAll(".m-vehicle-map__stop")
            ).toHaveLength(stopCount)
            expect(
              container.querySelector(".m-vehicle-map__route-shape")
            ).toBeInTheDocument()
          })
        })

        test("and vehicle is a shuttle; should display: vehicle icon, but not route shape or stops", () => {
          const selectedVehicle = shuttleFactory.build()

          setHtmlWidthHeightForLeafletMap()
          mockUseVehiclesForRouteMap({})
          mockUseVehicleForId([selectedVehicle])
          mockUserRoutePatternsByIdForVehicles([]) // no route pattern for shuttle vehicle

          const { container } = render(
            <MapDisplay
              selectedEntity={{
                type: SelectedEntityType.Vehicle,
                vehicleId: selectedVehicle.id,
              }}
              setSelection={jest.fn()}
              showSelectionCard={true}
            />
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
              showSelectionCard={true}
            />
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
