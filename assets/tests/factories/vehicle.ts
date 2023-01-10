import { Factory } from "fishery"
import { Vehicle, VehicleTimepointStatus } from "../../src/realtime"
import {
  dataDiscrepancyFactory,
  swiftlyDataDiscrepancySourceFactory,
  buslocDataDiscrepancySourceFactory,
} from "./dataDiscrepancy"

export default Factory.define<Vehicle>(({ sequence }) => ({
  id: `v${sequence}`,
  label: `v${sequence}-label`,
  runId: `run-${sequence}`,
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "39",
  tripId: `t${sequence}`,
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: `op${sequence}`,
  operatorFirstName: "WILL",
  operatorLastName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: `block-${sequence}`,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  incomingTripDirectionId: null,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
  isRevenue: true,
  layoverDepartureTime: null,
  dataDiscrepancies: [
    dataDiscrepancyFactory.build({
      attribute: "trip_id",
      sources: [
        swiftlyDataDiscrepancySourceFactory.build(),
        buslocDataDiscrepancySourceFactory.build(),
      ],
    }),
    dataDiscrepancyFactory.build({
      attribute: "route_id",
      sources: [
        swiftlyDataDiscrepancySourceFactory.withRouteId().build({
          value: null,
        }),
        buslocDataDiscrepancySourceFactory.withRouteId().build(),
      ],
    }),
  ],
  stopStatus: {
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    timepointId: "tp1",
    fractionUntilTimepoint: 0.5,
  } as VehicleTimepointStatus,
  scheduledLocation: {
    routeId: "39",
    directionId: 0,
    tripId: "scheduled trip",
    runId: "scheduled run",
    timeSinceTripStartTime: 0,
    headsign: "scheduled headsign",
    viaVariant: "scheduled via variant",
    timepointStatus: {
      timepointId: "tp1",
      fractionUntilTimepoint: 0.5,
    },
  },
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
  crowding: null,
}))
