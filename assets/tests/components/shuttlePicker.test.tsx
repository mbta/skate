import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import ShuttlePicker, { formatRunId } from "../../src/components/shuttlePicker"
import { ShuttleVehiclesProvider } from "../../src/contexts/shuttleVehiclesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { RunId, Vehicle } from "../../src/realtime"
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
  test("renders", () => {
    /*
    999-0501: known, no active shuttles, unselected
    999-0502: known, no active shuttles, selected
    999-0503: known, active shuttles, unselected
    999-0504: known, active shuttles, selected
    999-0511: unknown, unselected
    999-0512: unknown, selected
    */
    const selectedShuttleRunIds: RunId[] = ["999-0502", "999-0504", "999-0512"]
    const shuttles: Vehicle[] = [
      { ...vehicle, runId: "999-0503" },
      { ...vehicle, runId: "999-0504" },
      { ...vehicle, runId: "999-0511" },
      { ...vehicle, runId: "999-0512" },
    ]
    const tree = renderer.create(
      <StateDispatchProvider
        state={{
          ...initialState,
          selectedShuttleRunIds,
        }}
        dispatch={jest.fn()}
      >
        <ShuttleVehiclesProvider shuttles={shuttles}>
          <ShuttlePicker />
        </ShuttleVehiclesProvider>
      </StateDispatchProvider>
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
      .find(".m-route-picker__route-list-button--unselected")
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
      .find(".m-route-picker__route-list-button--selected")
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(deselectShuttleRun(vehicle.runId!))
  })
})

describe("formatRunId", () => {
  test("removes -", () => {
    expect(formatRunId("999-1234")).toEqual("999 1234")
  })

  test("removes leading 0s", () => {
    expect(formatRunId("999-0550")).toEqual("999 550")
  })
})
