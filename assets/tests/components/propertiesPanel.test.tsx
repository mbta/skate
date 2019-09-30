import React from "react"
import renderer from "react-test-renderer"
import PropertiesPanel from "../../src/components/propertiesPanel"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const route: Route = {
  id: "39",
  directionNames: {
    0: "Outbound",
    1: "Inbound",
  },
  name: "39",
}

describe("PropertiesPanel", () => {
  test("renders a vehicle", () => {
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
      bearing: 33,
      speed: 50.0,
      blockId: "block-1",
      headwaySecs: 859.1,
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduleAdherenceString: "0.0 sec (ontime)",
      scheduledHeadwaySecs: 120,
      isOffCourse: false,
      isLayingOver: false,
      layoverDepartureTime: null,
      blockIsActive: false,
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
        status: "in_transit_to",
        stopId: "s1",
        stopName: "Stop Name",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.5,
        timepointId: "tp1",
      },
      scheduledLocation: null,
      isOnRoute: true,
    }

    const tree = renderer
      .create(
        <PropertiesPanel
          selectedVehicleOrGhost={vehicle}
          selectedVehicleRoute={route}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a ghost", () => {
    const ghost: Ghost = {
      id: "ghost-trip",
      directionId: 0,
      routeId: "39",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      viaVariant: "X",
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
    }

    const tree = renderer
      .create(
        <PropertiesPanel
          selectedVehicleOrGhost={ghost}
          selectedVehicleRoute={route}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
