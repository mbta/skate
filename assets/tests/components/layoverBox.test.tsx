import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import LayoverBox from "../../src/components/layoverBox"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { TripsByIdProvider } from "../../src/contexts/tripsByIdContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime.d"
import { TripsById } from "../../src/schedule"
import { initialState, selectVehicle } from "../../src/state"

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
    scheduleAdherenceStatus: "on-time",
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    isLayingOver: true,
    layoverDepartureTime: 1000002,
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
    operatorId: "op2",
    operatorName: "JONES",
    bearing: 33,
    speed: 50.0,
    blockId: "block-1",
    headwaySecs: 859.1,
    headwaySpacing: HeadwaySpacing.Ok,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduleAdherenceString: "0.0 sec (ontime)",
    scheduleAdherenceStatus: "on-time",
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    isLayingOver: true,
    layoverDepartureTime: 1000001,
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
    isOnRoute: true,
  },
]

const tripsById: TripsById = {
  "39914128": {
    id: "39914128",
    routeId: "1",
    headsign: "headsign",
    directionId: 1,
    blockId: "block-1",
    routePatternId: "route-pattern-id",
    stopTimes: [],
  },
}

describe("LayoverBox", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <TripsByIdProvider tripsById={tripsById}>
          <LayoverBox classModifier="top" vehicles={vehicles} />
        </TripsByIdProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking on vehicle opens properties panel", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <TripsByIdProvider tripsById={tripsById}>
          <LayoverBox classModifier="bottom" vehicles={vehicles} />
        </TripsByIdProvider>
      </StateDispatchProvider>
    )

    wrapper
      .find(".m-layover-box__vehicle")
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(selectVehicle(vehicles[0].id))
  })

  test("vehicles are sorted", () => {
    const topWrapper = mount(
      <TripsByIdProvider tripsById={tripsById}>
        <LayoverBox classModifier="top" vehicles={vehicles} />
      </TripsByIdProvider>
    )

    const bottomWrapper = mount(
      <TripsByIdProvider tripsById={tripsById}>
        <LayoverBox classModifier="bottom" vehicles={vehicles} />
      </TripsByIdProvider>
    )

    expect(
      topWrapper.find(".m-layover-box__vehicle").map(icon => icon.text())
    ).toEqual(["1", "2"])

    expect(
      bottomWrapper.find(".m-layover-box__vehicle").map(icon => icon.text())
    ).toEqual(["2", "1"])
  })
})
