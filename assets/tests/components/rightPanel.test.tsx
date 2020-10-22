import React from "react"
import renderer from "react-test-renderer"
import RightPanel from "../../src/components/rightPanel"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import VehicleAndRouteForNotificationContext from "../../src/contexts/vehicleAndRouteForNotificationContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Notification, Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import { initialState, State } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

describe("rightPanel", () => {
  test("shows nothing if nothing is selected", () => {
    const tree = renderer.create(<RightPanel />).toJSON()
    expect(tree).toEqual(null)
  })

  test("shows a selected vehicle", () => {
    const state: State = { ...initialState, selectedVehicleId: "id" }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("shows a selected ghost", () => {
    const state: State = { ...initialState, selectedVehicleId: "ghost-id" }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <RightPanel selectedVehicleOrGhost={ghost} />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("shows a vehicle from a selected notification", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const route: Route = {
      id: "route",
      directionNames: { 0: "0", 1: "1" },
    } as Route
    const state: State = { ...initialState, selectedNotification: notification }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <VehicleAndRouteForNotificationContext.Provider
            value={{ vehicleOrGhost: vehicle, route }}
          >
            <RightPanel />
          </VehicleAndRouteForNotificationContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("if a vehicle from a notification is loading, show nothing", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const state: State = { ...initialState, selectedNotification: notification }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <VehicleAndRouteForNotificationContext.Provider value={undefined}>
            <RightPanel />
          </VehicleAndRouteForNotificationContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toEqual(null)
  })

  test("if a vehicle from a notification failed to load, show nothing", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const state: State = { ...initialState, selectedNotification: notification }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <VehicleAndRouteForNotificationContext.Provider value={null}>
            <RightPanel />
          </VehicleAndRouteForNotificationContext.Provider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toEqual(null)
  })
})

const vehicle: Vehicle = {
  id: "id",
  label: "label",
  runId: "run",
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "route",
  tripId: "t1",
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: "op1",
  operatorName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
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
  crowding: null,
}
const ghost: Ghost = {
  id: "ghost-id",
  directionId: 0,
  routeId: "route",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: "123-0123",
  viaVariant: "X",
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  routeStatus: "on_route",
  blockWaivers: [],
}
