import { Factory } from "fishery"
import { defaultCenter } from "../../src/components/map"
import {
  VehicleInScheduledService,
  VehicleTimepointStatus,
} from "../../src/realtime"
import {
  dataDiscrepancyFactory,
  swiftlyDataDiscrepancySourceFactory,
  buslocDataDiscrepancySourceFactory,
} from "./dataDiscrepancy"
import { localGeoCoordinateFactory } from "./geoCoordinate"
import { runIdFactory } from "./run"

export const randomLocationVehicle = Factory.define<VehicleInScheduledService>(
  ({ sequence, associations }) => ({
    id: `v${sequence}`,
    label: `v${sequence}-label`,
    runId:
      associations.runId || runIdFactory.transient({ prefix: "run" }).build(),
    timestamp: 123,
    ...localGeoCoordinateFactory.build(),
    directionId: 0,
    routeId: "39",
    routePatternId: "39-_-0",
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
      routePatternId: "39-_-0",
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
  })
)

export const centerLocationVehicle = randomLocationVehicle.params({
  latitude: defaultCenter.lat,
  longitude: defaultCenter.lng,
})

const vehicleFactory = centerLocationVehicle

export default vehicleFactory

export const shuttleFactory = vehicleFactory.params({
  isShuttle: true,

  runId: "999-0555",
  tripId: "BL-10987654321",
  routeId: "Shuttle-Generic",

  crowding: null,

  dataDiscrepancies: [],
})

export const invalidVehicleFactory = vehicleFactory.params({
  isOffCourse: true,
})
