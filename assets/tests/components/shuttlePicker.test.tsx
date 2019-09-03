import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import ShuttlePicker from "../../src/components/shuttlePicker"
import { ShuttleVehiclesProvider } from "../../src/contexts/shuttleVehiclesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"
import {
  deselectShuttleRun,
  initialState,
  selectShuttleRun,
} from "../../src/state"

const vehicle: Vehicle = {
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

describe("ShuttlePicker", () => {
  test("renders a list of runs", () => {
    const tree = renderer.create(
      <ShuttleVehiclesProvider shuttles={[vehicle]}>
        <ShuttlePicker />
      </ShuttleVehiclesProvider>
    )

    expect(tree).toMatchSnapshot()
  })

  test("clicking an unselected run id adds it to selected run ids", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <ShuttleVehiclesProvider shuttles={[vehicle]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    wrapper
      .find(".m-route-picker__route-list-button")
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(selectShuttleRun(vehicle.runId!))
  })

  test("clicking a selected run id removes it from selected run ids", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [vehicle.runId!] }}
        dispatch={dispatch}
      >
        <ShuttleVehiclesProvider shuttles={[vehicle]}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
    )
    wrapper
      .find(".m-route-picker__route-list-button")
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(deselectShuttleRun(vehicle.runId!))
  })
})
