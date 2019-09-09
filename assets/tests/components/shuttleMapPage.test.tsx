import React from "react"
import renderer from "react-test-renderer"
import ShuttleMapPage from "../../src/components/shuttleMapPage"
import { ShuttleVehiclesProvider } from "../../src/contexts/shuttleVehiclesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"
import { initialState } from "../../src/state"

const shuttle: Vehicle = {
  id: "y1818",
  label: "1818",
  runId: "999-0555",
  timestamp: 1557160307,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "1",
  tripId: "39914237",
  headsign: "h1",
  viaVariant: "4",
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
  isOnRoute: true,
}

describe("Shuttle Map Page", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <ShuttleVehiclesProvider shuttles={[shuttle]}>
          <ShuttleMapPage />
        </ShuttleVehiclesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders selected shuttle routes", () => {
    const dispatch = jest.fn()
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={{ ...initialState, selectedShuttleRunIds: [shuttle.runId!] }}
          dispatch={dispatch}
        >
          <ShuttleVehiclesProvider shuttles={[shuttle]}>
            <ShuttleMapPage />
          </ShuttleVehiclesProvider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
