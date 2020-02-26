import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import LayoverBox, {
  byLayoverDeparture,
  LayoverBoxPosition,
} from "../../src/components/layoverBox"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime.d"
import { initialState, selectVehicle } from "../../src/state"

const vehicles: Vehicle[] = [
  {
    id: "y1818",
    label: "1818",
    runId: "run-later",
    timestamp: 1557160307,
    latitude: 0,
    longitude: 0,
    directionId: 0,
    routeId: "1",
    tripId: "39914237",
    headsign: "headsign",
    viaVariant: null,
    operatorId: "op1",
    operatorName: "SMITH",
    bearing: 33,
    blockId: "block-1",
    headwaySecs: 859.1,
    headwaySpacing: HeadwaySpacing.Ok,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    layoverDepartureTime: 1000002,
    blockIsActive: true,
    dataDiscrepancies: [],
    stopStatus: {
      stopId: "57",
      stopName: "57",
    },
    timepointStatus: {
      fractionUntilTimepoint: 0.5,
      timepointId: "MATPN",
    },
    scheduledLocation: null,
    routeStatus: "on_route",
    endOfTripType: "another_trip",
    blockWaivers: [],
  },
  {
    id: "y0479",
    label: "0479",
    runId: "run-sooner",
    timestamp: 1557160347,
    latitude: 0,
    longitude: 0,
    directionId: 1,
    routeId: "1",
    tripId: "39914128",
    headsign: "headsign",
    viaVariant: null,
    operatorId: "op2",
    operatorName: "JONES",
    bearing: 33,
    blockId: "block-1",
    headwaySecs: 859.1,
    headwaySpacing: HeadwaySpacing.Ok,
    previousVehicleId: "v2",
    scheduleAdherenceSecs: 0,
    scheduledHeadwaySecs: 120,
    isOffCourse: false,
    layoverDepartureTime: 1000001,
    blockIsActive: true,
    dataDiscrepancies: [],
    stopStatus: {
      stopId: "59",
      stopName: "59",
    },
    timepointStatus: {
      fractionUntilTimepoint: 0.0,
      timepointId: "MORTN",
    },
    scheduledLocation: {
      routeId: "1",
      directionId: 1,
      tripId: "scheduled trip",
      runId: "scheduled run",
      timeSinceTripStartTime: 0,
      headsign: "scheduled headsign",
      viaVariant: "scheduled via variant",
      timepointStatus: {
        timepointId: "MORTN",
        fractionUntilTimepoint: 0.0,
      },
    },
    routeStatus: "on_route",
    endOfTripType: "another_trip",
    blockWaivers: [],
  },
]

const ghost: Ghost = {
  id: "ghost",
  directionId: 0,
  routeId: "1",
  tripId: "trip-ghost",
  headsign: "headsign-ghost",
  blockId: "block-ghost",
  runId: "run-ghost_soonest",
  viaVariant: null,
  layoverDepartureTime: 1000000,
  scheduledTimepointStatus: {
    timepointId: "MORTN",
    fractionUntilTimepoint: 0.0,
  },
  routeStatus: "laying_over",
  blockWaivers: [],
}

describe("LayoverBox", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <LayoverBox
          vehiclesAndGhosts={vehicles}
          position={LayoverBoxPosition.Top}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders ghost", () => {
    const tree = renderer
      .create(
        <LayoverBox
          vehiclesAndGhosts={[ghost]}
          position={LayoverBoxPosition.Top}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking on vehicle opens properties panel", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <LayoverBox
          vehiclesAndGhosts={vehicles}
          position={LayoverBoxPosition.Bottom}
        />
      </StateDispatchProvider>
    )

    wrapper
      .find(".m-layover-box__vehicle")
      .first()
      .simulate("click")

    expect(dispatch).toHaveBeenCalledWith(selectVehicle(vehicles[0].id))
  })

  test("vehicles are sorted", () => {
    const vehiclesAndGhosts: VehicleOrGhost[] = ([] as VehicleOrGhost[]).concat(
      vehicles,
      ghost
    )
    const topWrapper = mount(
      <LayoverBox
        vehiclesAndGhosts={vehiclesAndGhosts}
        position={LayoverBoxPosition.Top}
      />
    )

    const bottomWrapper = mount(
      <LayoverBox
        vehiclesAndGhosts={vehiclesAndGhosts}
        position={LayoverBoxPosition.Bottom}
      />
    )

    expect(
      topWrapper.find(".m-layover-box__vehicle").map(icon => icon.text())
    ).toEqual(["ghost_soonest", "sooner", "later"])

    expect(
      bottomWrapper.find(".m-layover-box__vehicle").map(icon => icon.text())
    ).toEqual(["later", "sooner", "ghost_soonest"])
  })
})

describe("byLayoverDeparture", () => {
  const vehicleDepartingSooner: Vehicle = {
    layoverDepartureTime: 1,
  } as Vehicle
  const vehicleDepartingLater: Vehicle = {
    layoverDepartureTime: 2,
  } as Vehicle

  test("orders in descending order for the bottom layover box, so that vehicles leaving sooner are to the right", () => {
    const isBottomLayoverBox: boolean = true

    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingSooner,
        vehicleDepartingLater
      )
    ).toEqual(1)
    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingLater,
        vehicleDepartingSooner
      )
    ).toEqual(-1)
  })

  test("orders in ascending order for the bottom layover box, so that vehicles leaving sooner are to the left", () => {
    const isBottomLayoverBox: boolean = false

    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingSooner,
        vehicleDepartingLater
      )
    ).toEqual(-1)
    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingLater,
        vehicleDepartingSooner
      )
    ).toEqual(1)
  })

  test("returns 0 if either vehicle is missing the layoverDepartureTime", () => {
    const isBottomLayoverBox: boolean = true
    const vehicleMissingLayoverDepartureTime: Vehicle = {
      layoverDepartureTime: null,
    } as Vehicle

    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleDepartingSooner,
        vehicleMissingLayoverDepartureTime
      )
    ).toEqual(0)
    expect(
      byLayoverDeparture(isBottomLayoverBox)(
        vehicleMissingLayoverDepartureTime,
        vehicleDepartingSooner
      )
    ).toEqual(0)
  })
})
