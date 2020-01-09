import React from "react"
import renderer from "react-test-renderer"
import IncomingBox from "../../src/components/incomingBox"
import { LadderDirection } from "../../src/models/ladderDirection"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"

describe("IncomingBox", () => {
  test("renders empty state", () => {
    const tree = renderer
      .create(
        <IncomingBox
          vehiclesAndGhosts={[]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a vehicle", () => {
    const vehicle: Vehicle = {
      id: "y0654",
      label: "0654",
      runId: "126-1056",
      timestamp: 1576091706,
      latitude: 42.36296,
      longitude: -71.05814,
      directionId: 0,
      routeId: "111",
      tripId: "42199995",
      headsign: "Woodlawn",
      viaVariant: "5",
      operatorId: "1",
      operatorName: "OPERATOR",
      bearing: 137.5,
      blockId: "G111-165",
      headwaySecs: 396.3,
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "y0620",
      scheduleAdherenceSecs: 0,
      scheduledHeadwaySecs: 420,
      isOffCourse: false,
      layoverDepartureTime: 1576091880,
      blockIsActive: true,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "stop",
        stopName: "Stop",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.0,
        timepointId: "TIMEP",
      },
      scheduledLocation: {
        routeId: "111",
        directionId: 1,
        tripId: "42199996",
        headsign: "scheduled headsign",
        viaVariant: "5",
        timepointStatus: {
          timepointId: "TIMEP",
          fractionUntilTimepoint: 0.0,
        },
      },
      routeStatus: "pulling_out",
      endOfTripType: "another_trip",
    }

    const tree = renderer
      .create(
        <IncomingBox
          vehiclesAndGhosts={[vehicle]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a ghost", () => {
    const ghost: Ghost = {
      id: "ghost",
      directionId: 0,
      routeId: "111",
      tripId: "42199995",
      headsign: "Woodlawn",
      blockId: "G111-165",
      runId: "126-1056",
      viaVariant: "5",
      layoverDepartureTime: 1576091880,
      scheduledTimepointStatus: {
        timepointId: "TIMEP",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "pulling_out",
    }

    const tree = renderer
      .create(
        <IncomingBox
          vehiclesAndGhosts={[ghost]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
