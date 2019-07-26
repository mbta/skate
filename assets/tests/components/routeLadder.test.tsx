import { mount } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route, Vehicle } from "../../src/skate"
import { deselectRoute, selectVehicle } from "../../src/state"

// tslint:disable: object-literal-sort-keys

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

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
    }
    const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesForRoute={null}
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
    }
    const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]
    const vehicles: Vehicle[] = [
      {
        id: "y1818",
        label: "1818",
        runId: "run-1",
        timestamp: 1557160307,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "1",
        tripId: "39914237",
        headsign: "h0",
        viaVariant: "4",
        operatorId: "op1",
        operatorName: "SMITH",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: "ok",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        blockIsActive: true,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "57",
          stopName: "57",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "MATPN",
        },
        scheduledLocation: null,
      },
      {
        id: "y0479",
        label: "0479",
        runId: "run-2",
        timestamp: 1557160347,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "1",
        tripId: "39914128",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorName: "JONES",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: "ok",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        blockIsActive: true,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
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
      },
    ]

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesForRoute={{
            onRouteVehicles: vehicles,
            incomingVehicles: [],
          }}
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
    }
    const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]
    const vehicles: Vehicle[] = [
      {
        id: "y1818",
        label: "1818",
        runId: "run-1",
        timestamp: 1557160307,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "1",
        tripId: "39914237",
        headsign: "h0",
        viaVariant: "4",
        operatorId: "op1",
        operatorName: "SMITH",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: "ok",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        blockIsActive: true,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "57",
          stopName: "57",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "MATPN",
        },
        scheduledLocation: null,
      },
      {
        id: "y0479",
        label: "0479",
        runId: "run-2",
        timestamp: 1557160347,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "1",
        tripId: "39914128",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorName: "JONES",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        headwaySpacing: "ok",
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        isOffCourse: false,
        blockIsActive: true,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
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
      },
    ]

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesForRoute={{
            onRouteVehicles: [],
            incomingVehicles: vehicles,
          }}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("displays loading if we are fetching the timepoints", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
    }
    const timepoints = null

    const tree = renderer
      .create(
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesForRoute={null}
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
    }
    const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

    const wrapper = mount(
      <DispatchProvider dispatch={mockDispatch}>
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesForRoute={null}
          selectedVehicleId={undefined}
        />
      </DispatchProvider>
    )
    wrapper.find(".m-route-ladder__header .m-close-button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
  })

  test("clicking the reverse button reverses the order of the timepoints", () => {
    const route: Route = {
      id: "28",
      directionNames: { 0: "Outbound", 1: "Inbound" },
    }
    const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

    const wrapper = mount(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehiclesForRoute={null}
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
    }
    const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]
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
      speed: 50.0,
      blockId: "block-1",
      headwaySecs: 859.1,
      headwaySpacing: "ok",
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduleAdherenceString: "0.0 sec (ontime)",
      scheduleAdherenceStatus: "on-time",
      scheduledHeadwaySecs: 120,
      isOffCourse: false,
      blockIsActive: true,
      dataDiscrepancies: [],
      stopStatus: {
        status: "in_transit_to",
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.5,
        timepointId: "MATPN",
      },
      scheduledLocation: null,
    }

    const wrapper = mount(
      <DispatchProvider dispatch={mockDispatch}>
        <RouteLadder
          route={route}
          timepoints={timepoints}
          vehiclesForRoute={{
            onRouteVehicles: [],
            incomingVehicles: [vehicle],
          }}
          selectedVehicleId={undefined}
        />
      </DispatchProvider>
    )
    wrapper.find(".m-incoming-box__vehicle").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle.id))
  })
})
