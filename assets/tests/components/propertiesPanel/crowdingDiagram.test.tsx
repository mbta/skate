import React from "react"
import renderer from "react-test-renderer"
import CrowdingDiagram from "../../../src/components/propertiesPanel/crowdingDiagram"
import { Vehicle } from "../../../src/realtime"

describe("CrowdingDiagram", () => {
  const vehicle: Vehicle = {
    id: "v1",
    label: "v1-label",
    runId: "run-1",
    timestamp: 123,
    latitude: 0,
    longitude: 0,
    directionId: 0,
    routeId: "39",
    tripId: "t1",
    headsign: "Forest Hills",
    viaVariant: "X",
    operatorId: "op1",
    operatorName: "SMITH",
    operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
    bearing: 33,
    blockId: "block-1",
    headwaySecs: 859.1,
    headwaySpacing: null,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduledHeadwaySecs: 120,
    isShuttle: false,
    isOverload: false,
    isOffCourse: false,
    layoverDepartureTime: null,
    dataDiscrepancies: [
      {
        attribute: "trip_id",
        sources: [
          {
            id: "swiftly",
            value: "swiftly-trip-id",
          },
          {
            id: "busloc",
            value: "busloc-trip-id",
          },
        ],
      },
    ],
    stopStatus: {
      stopId: "s1",
      stopName: "Stop Name",
    },
    timepointStatus: {
      fractionUntilTimepoint: 0.5,
      timepointId: "tp1",
    },
    scheduledLocation: null,
    routeStatus: "on_route",
    endOfTripType: "another_trip",
    blockWaivers: [],
    load: null,
    capacity: null,
    occupancyStatus: null,
    occupancyPercentage: null,
    routeHasReliableCrowdingData: false,
  }

  test("renders nothing if route isn't considered reliable", () => {
    const tree = renderer.create(<CrowdingDiagram vehicle={vehicle} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an untrusted APC", () => {
    const untrustedVehicle = {
      ...vehicle,
      routeHasReliableCrowdingData: true,
    }

    const tree = renderer
      .create(<CrowdingDiagram vehicle={untrustedVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an empty bus", () => {
    const emptyVehicle = {
      ...vehicle,
      routeHasReliableCrowdingData: true,
      load: 0,
      capacity: 18,
      occupancyPercentage: 0,
      occupancyStatus: "MANY_SEATS_AVAILABLE",
    }

    const tree = renderer
      .create(<CrowdingDiagram vehicle={emptyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for an uncrowded bus", () => {
    const uncrowdedVehicle = {
      ...vehicle,
      routeHasReliableCrowdingData: true,
      load: 1,
      capacity: 20,
      occupancyPercentage: 0.05,
      occupancyStatus: "MANY_SEATS_AVAILABLE",
    }

    const tree = renderer
      .create(<CrowdingDiagram vehicle={uncrowdedVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for a somewhat crowded bus", () => {
    const somewhatCrowdedVehicle = {
      ...vehicle,
      routeHasReliableCrowdingData: true,
      load: 10,
      capacity: 20,
      occupancyPercentage: 0.5,
      occupancyStatus: "FEW_SEATS_AVAILABLE",
    }

    const tree = renderer
      .create(<CrowdingDiagram vehicle={somewhatCrowdedVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders correctly for a crowded bus", () => {
    const crowdedVehicle = {
      ...vehicle,
      routeHasReliableCrowdingData: true,
      load: 45,
      capacity: 30,
      occupancyPercentage: 1.5,
      occupancyStatus: "FULL",
    }

    const tree = renderer
      .create(<CrowdingDiagram vehicle={crowdedVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
