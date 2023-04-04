import "@testing-library/jest-dom"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
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
import { mockUsePatternsByIdForVehicles } from "../../testHelpers/mockHelpers"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import { routePatternFactory } from "../../factories/routePattern"
import usePatternsByIdForRoute from "../../../src/hooks/usePatternsByIdForRoute"
import { routePropertiesCard } from "../../testHelpers/selectors/components/mapPage/routePropertiesCard"
import { vehiclePropertiesCard } from "../../testHelpers/selectors/components/mapPage/vehiclePropertiesCard"
import { zoomInButton } from "../../testHelpers/selectors/components/map"
import { patternDisplayName } from "../../../src/components/mapPage/routePropertiesCard"

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

function getAllStationIcons(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(".c-station-icon")
}

describe("<MapDisplay />", () => {
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
          showSelectionCard={false}
        />
      )

      const routeShape = container.querySelector(".c-vehicle-map__route-shape")
      expect(routeShape).toBeVisible()
      expect(vehiclePropertiesCard.query()).not.toBeInTheDocument()
    })

    test("when showSelectionCard is true, vehicle properties card should be visible", async () => {
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
          showSelectionCard={true}
        />
      )

      const routeShape = container.querySelector(".c-vehicle-map__route-shape")

      expect(routeShape).toBeVisible()
      expect(vehiclePropertiesCard.get()).toBeVisible()
    })

    test("when showSelectionCard is true and route pattern is selected, route properties card should be visible", async () => {
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
              routePatternId: routePattern.id,
            }}
            setSelection={jest.fn()}
            showSelectionCard={true}
          />
        </RoutesProvider>
      )

      expect(routePropertiesCard.get()).toBeVisible()
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
                showSelectionCard={false}
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

          test("hovering over route shape displays tooltip when variant", async () => {
            const route = routeFactory.build({ id: "66" })

            const selectedVehicle = randomLocationVehicle.build({
              routeId: route.id,
              routePatternId: "66-3-1",
            })

            const routePattern = routePatternFactory.build({
              routeId: route.id,
              id: selectedVehicle.routePatternId!,
            })

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([selectedVehicle])
            mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
            ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
              [routePattern.id]: routePattern,
            })

            const { container } = render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={jest.fn()}
                  showSelectionCard={true}
                />
              </RoutesProvider>
            )

            await userEvent.hover(
              container.querySelector(".c-vehicle-map__route-shape")!
            )
            expect(
              screen.getByText("Click to select route 66_3.")
            ).toBeVisible()
          })

          test("hovering over route shape displays tooltip when no variant", async () => {
            const route = routeFactory.build({ id: "66" })

            const selectedVehicle = randomLocationVehicle.build({
              routeId: route.id,
              routePatternId: "66-_-1",
            })

            const routePattern = routePatternFactory.build({
              routeId: route.id,
              id: selectedVehicle.routePatternId!,
            })

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([selectedVehicle])
            mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
            ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
              [routePattern.id]: routePattern,
            })

            const { container } = render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={jest.fn()}
                  showSelectionCard={true}
                />
              </RoutesProvider>
            )

            await userEvent.hover(
              container.querySelector(".c-vehicle-map__route-shape")!
            )

            expect(screen.getByText("Click to select route 66.")).toBeVisible()
          })

          test("hovering over route shape displays tooltip when malformed id", async () => {
            const route = routeFactory.build({ id: "66" })

            const selectedVehicle = randomLocationVehicle.build({
              routeId: route.id,
              routePatternId: "badlyFormattedId",
            })

            const routePattern = routePatternFactory.build({
              routeId: route.id,
              id: selectedVehicle.routePatternId!,
            })

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([selectedVehicle])
            mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
            ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
              [routePattern.id]: routePattern,
            })

            const { container } = render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={jest.fn()}
                  showSelectionCard={true}
                />
              </RoutesProvider>
            )

            await userEvent.hover(
              container.querySelector(".c-vehicle-map__route-shape")!
            )

            expect(screen.getByText("Click to select route 66.")).toBeVisible()
          })

          test("clicking the route shape calls setSelection ", async () => {
            const route = routeFactory.build()

            const selectedVehicle = randomLocationVehicle.build({
              routeId: route.id,
            })

            const routePattern = routePatternFactory.build({
              routeId: route.id,
              id: selectedVehicle.routePatternId!,
            })

            setHtmlWidthHeightForLeafletMap()
            mockUseVehicleForId([selectedVehicle])
            mockUseVehiclesForRouteMap({ [route.id]: [selectedVehicle] })
            ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
              [routePattern.id]: routePattern,
            })

            const setSelectedEntityMock = jest.fn()

            const { container } = render(
              <RoutesProvider routes={[route]}>
                <MapDisplay
                  selectedEntity={{
                    type: SelectedEntityType.Vehicle,
                    vehicleId: selectedVehicle.id,
                  }}
                  setSelection={setSelectedEntityMock}
                  showSelectionCard={true}
                />
              </RoutesProvider>
            )

            fireEvent.click(
              container.querySelector(".c-vehicle-map__route-shape")!
            )
            await waitFor(() =>
              expect(setSelectedEntityMock).toHaveBeenCalledWith({
                type: SelectedEntityType.RoutePattern,
                routeId: routePattern.routeId,
                routePatternId: routePattern.id,
              })
            )
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
          expect(vehiclePropertiesCard.get()).toBeVisible()
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
                showSelectionCard={true}
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
                showSelectionCard={true}
              />
            </RoutesProvider>
          )

          expect(routePropertiesCard.query()).not.toBeInTheDocument()
        })
        test("selecting a pattern in RPC dispatches setSelection event", async () => {
          setHtmlWidthHeightForLeafletMap()

          const route = routeFactory.build()
          const vehicles = randomLocationVehicle.buildList(3)

          mockUseVehiclesForRouteMap({ [route.id]: vehicles })
          const [routePattern1, routePattern2] = routePatternFactory.buildList(
            2,
            {
              routeId: route.id,
            }
          )
          ;(usePatternsByIdForRoute as jest.Mock).mockReturnValue({
            [routePattern1.id]: routePattern1,
            [routePattern2.id]: routePattern2,
          })

          const setSelectedEntityMock = jest.fn()

          render(
            <RoutesProvider routes={[route]}>
              <MapDisplay
                selectedEntity={{
                  type: SelectedEntityType.RoutePattern,
                  routeId: routePattern1.routeId,
                  routePatternId: routePattern1.id,
                }}
                setSelection={setSelectedEntityMock}
                showSelectionCard={true}
              />
            </RoutesProvider>
          )

          expect(routePropertiesCard.get()).toBeInTheDocument()

          await userEvent.click(
            screen.getByRole("button", { name: "Show variants" })
          )

          await userEvent.click(
            screen.getByRole("radio", {
              name: new RegExp(patternDisplayName(routePattern2).name),
            })
          )
          expect(setSelectedEntityMock).toHaveBeenCalledWith({
            type: SelectedEntityType.RoutePattern,
            routeId: routePattern2.routeId,
            routePatternId: routePattern2.id,
          })
        })
      })
    })
  })
})
