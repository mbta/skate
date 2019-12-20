import { mount } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"
import { LadderDirection } from "../../src/components/ladder"
import RouteLadder, { groupByPosition } from "../../src/components/routeLadder"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import {
  Ghost,
  RouteStatus,
  Vehicle,
  VehicleOrGhost,
} from "../../src/realtime.d"
import { Route } from "../../src/schedule.d"
import { deselectRoute, initialState, selectVehicle } from "../../src/state"

// tslint:disable: object-literal-sort-keys

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

const vehicles: Vehicle[] = [
  {
    id: "y1818",
    label: "1818",
    runId: "run-1",
    timestamp: 1557160307,
    latitude: 0,
    longitude: 0,
    directionId: 0,
    routeId: "28",
    tripId: "39914237",
    operatorId: "op1",
    operatorName: "SMITH",
    bearing: 33,
    blockId: "block-1",
    headsign: "h1",
    viaVariant: "4",
    headwaySecs: 859.1,
    headwaySpacing: HeadwaySpacing.Ok,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    layoverDepartureTime: null,
    blockIsActive: true,
    dataDiscrepancies: [],
    stopStatus: {
      stopId: "57",
      stopName: "57",
    },
    timepointStatus: {
      fractionUntilTimepoint: 0.5,
      timepointId: "MATPN",
    },
    scheduledLocation: null,
    routeStatus: "on_route",
  },
  {
    id: "y0479",
    label: "0479",
    runId: "run-2",
    timestamp: 1557160347,
    latitude: 0,
    longitude: 0,
    directionId: 1,
    routeId: "28",
    tripId: "39914128",
    operatorId: "op2",
    operatorName: "JONES",
    bearing: 33,
    blockId: "block-1",
    headsign: null,
    viaVariant: null,
    headwaySecs: 859.1,
    headwaySpacing: HeadwaySpacing.Ok,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    layoverDepartureTime: null,
    blockIsActive: true,
    dataDiscrepancies: [],
    stopStatus: {
      stopId: "59",
      stopName: "59",
    },
    timepointStatus: {
      fractionUntilTimepoint: 0.0,
      timepointId: "MORTN",
    },
    scheduledLocation: {
      directionId: 1,
      timepointStatus: {
        timepointId: "MORTN",
        fractionUntilTimepoint: 0.0,
      },
    },
    routeStatus: "on_route",
  },
]

describe("routeLadder", () => {
  const originalGetBBox = SVGSVGElement.prototype.getBBox
  const originalGetElementsByClassName = document.getElementsByClassName

  beforeEach(() => {
    SVGSVGElement.prototype.getBBox = () => {
      return {
        height: 100,
        width: 50,
      } as DOMRect
    }
    const mockElement = {
      offsetHeight: 120,
    }
    // @ts-ignore
    document.getElementsByClassName = () => [mockElement]
  })

  afterEach(() => {
    SVGSVGElement.prototype.getBBox = originalGetBBox
    document.getElementsByClassName = originalGetElementsByClassName
  })

  test("renders a route ladder", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = ["MATPN", "WELLH", "MORTN"]

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={undefined}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with vehicles", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = ["MATPN", "WELLH", "MORTN"]

    const ghost: Ghost = {
      id: "ghost-trip",
      directionId: 0,
      routeId: route.id,
      tripId: "ghost trip",
      headsign: "headsign",
      blockId: "ghost block",
      runId: "123-0123",
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "MORTN",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
    }

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={(vehicles as VehicleOrGhost[]).concat([ghost])}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with vehicles in the incoming box", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = ["MATPN", "WELLH", "MORTN"]
    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={vehicles.map((vehicle: Vehicle) => ({
            ...vehicle,
            routeStatus: "pulling_out" as RouteStatus,
          }))}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a route ladder with laying over vehicles", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }

    const timepoints = ["MATPN", "WELLH", "MORTN"]

    const [v1, v2] = vehicles
    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          selectedVehicleId={undefined}
          timepoints={timepoints}
          vehiclesAndGhosts={[
            { ...v1, routeStatus: "laying_over" },
            { ...v2, routeStatus: "laying_over" },
          ]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("displays loading if we are fetching the timepoints", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = null

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={undefined}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking the close button deselects that route", () => {
    const mockDispatch = jest.fn()
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = ["MATPN", "WELLH", "MORTN"]

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={undefined}
          selectedVehicleId={undefined}
        />
      </StateDispatchProvider>
    )
    wrapper.find(".m-route-ladder__header .m-close-button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
  })

  test("clicking the reverse button reverses the order of the timepoints", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = ["MATPN", "WELLH", "MORTN"]

    const wrapper = mount(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesAndGhosts={undefined}
        selectedVehicleId={undefined}
      />
    )
    act(() => {
      wrapper.find(".m-route-ladder__reverse").simulate("click")
    })

    expect(
      wrapper.find(".m-ladder__timepoint-name").map(node => node.text())
    ).toEqual(["MORTN", "WELLH", "MATPN"])
  })

  test("clicking an incoming vehicle selects that vehicle", () => {
    const mockDispatch = jest.fn()

    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
      name: "28",
    }
    const timepoints = ["MATPN", "WELLH", "MORTN"]
    const vehicle: Vehicle = {
      id: "v1",
      label: "v1",
      runId: "run1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      directionId: 1,
      routeId: "28",
      tripId: "trip",
      headsign: null,
      viaVariant: null,
      operatorId: "op1",
      operatorName: "SMITH",
      bearing: 33,
      blockId: "block-1",
      headwaySecs: 859.1,
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduledHeadwaySecs: 120,
      isOffCourse: false,
      layoverDepartureTime: null,
      blockIsActive: true,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        timepointId: "MATPN",
        fractionUntilTimepoint: 0.5,
      },
      scheduledLocation: null,
      routeStatus: "pulling_out",
    }

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesAndGhosts={[vehicle]}
          selectedVehicleId={undefined}
        />
      </StateDispatchProvider>
    )
    wrapper.find(".m-incoming-box__vehicle").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle.id))
  })
})

describe("groupByPosition", () => {
  const emptyByPosition = {
    onRoute: [],
    layingOverTop: [],
    layingOverBottom: [],
    incoming: [],
  }
  test("loading", () => {
    expect(groupByPosition(undefined, "1", LadderDirection.ZeroToOne)).toEqual(
      emptyByPosition
    )
  })

  test("on route", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "1",
      directionId: 0,
      routeStatus: "on_route",
    } as Vehicle
    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [vehicle],
    })
  })

  test("laying over", () => {
    const ladderDirection: LadderDirection = LadderDirection.ZeroToOne
    const top: Vehicle = {
      id: "y0001",
      routeId: "1",
      directionId: 1,
      routeStatus: "laying_over",
    } as Vehicle
    const bottom: Vehicle = {
      id: "y0002",
      routeId: "1",
      directionId: 0,
      routeStatus: "laying_over",
    } as Vehicle
    expect(groupByPosition([top, bottom], "1", ladderDirection)).toEqual({
      ...emptyByPosition,
      layingOverTop: [top],
      layingOverBottom: [bottom],
    })
  })

  test("pulling out", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "1",
      directionId: 0,
      routeStatus: "pulling_out",
    } as Vehicle
    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      incoming: [vehicle],
    })
  })

  test("incoming from another route", () => {
    const vehicle: Vehicle = {
      id: "y0001",
      routeId: "2",
      directionId: 0,
      routeStatus: "on_route",
    } as Vehicle
    expect(groupByPosition([vehicle], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      incoming: [vehicle],
    })
  })

  test("on route ghost", () => {
    const ghost: Ghost = {
      id: "ghost",
      routeId: "1",
      directionId: 0,
      routeStatus: "on_route",
    } as Ghost
    expect(groupByPosition([ghost], "1", LadderDirection.ZeroToOne)).toEqual({
      ...emptyByPosition,
      onRoute: [ghost],
    })
  })
})
