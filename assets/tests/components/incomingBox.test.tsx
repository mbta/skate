import React from "react"
import renderer from "react-test-renderer"
import IncomingBox from "../../src/components/incomingBox"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { LadderDirection } from "../../src/models/ladderDirection"
import { Ghost, VehicleInScheduledService } from "../../src/realtime"
import { initialState, selectVehicle } from "../../src/state"

import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

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
    const vehicle: VehicleInScheduledService = vehicleFactory.build({
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
      operatorFirstName: "OPPIE",
      operatorLastName: "OPERATOR",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 137.5,
      blockId: "G111-165",
      previousVehicleId: "y0620",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: 1576091880,
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
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "5",
        timepointStatus: {
          timepointId: "TIMEP",
          fractionUntilTimepoint: 0.0,
        },
      },
      routeStatus: "pulling_out",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: null,
    })

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

  test("renders a vehicle with the opposite incoming direction ID", () => {
    const vehicle = vehicleFactory.build({
      directionId: 0,
      incomingTripDirectionId: 1,
      label: "vehicle",
      blockId: "block",
      runId: "run",
      operatorFirstName: "Fake",
      operatorLastName: "Operator",
      operatorId: "1234",
    })
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
    const ghost: Ghost = ghostFactory.build({
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
      scheduledLogonTime: null,
      routeStatus: "pulling_out",
      blockWaivers: [],
    })

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

  test("renders a crowding view of a vehicle", () => {
    const vehicle: VehicleInScheduledService = vehicleFactory.build({
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
      operatorFirstName: "OPPIE",
      operatorLastName: "OPERATOR",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 137.5,
      blockId: "G111-165",
      previousVehicleId: "y0620",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: 1576091880,
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
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "5",
        timepointStatus: {
          timepointId: "TIMEP",
          fractionUntilTimepoint: 0.0,
        },
      },
      routeStatus: "pulling_out",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: {
        occupancyStatus: "EMPTY",
        load: 0,
        occupancyPercentage: 0.0,
        capacity: 18,
      },
    })

    const tree = renderer
      .create(
        <IncomingBox
          vehiclesAndGhosts={[vehicle]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
          displayCrowding={true}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a crowding view missing crowding data", () => {
    const vehicle: VehicleInScheduledService = vehicleFactory.build({
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
      operatorFirstName: "OPPIE",
      operatorLastName: "OPERATOR",
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      bearing: 137.5,
      blockId: "G111-165",
      previousVehicleId: "y0620",
      scheduleAdherenceSecs: 0,
      isShuttle: false,
      isOverload: false,
      isOffCourse: false,
      isRevenue: true,
      layoverDepartureTime: 1576091880,
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
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "5",
        timepointStatus: {
          timepointId: "TIMEP",
          fractionUntilTimepoint: 0.0,
        },
      },
      routeStatus: "pulling_out",
      endOfTripType: "another_trip",
      blockWaivers: [],
      crowding: null,
    })

    const tree = renderer
      .create(
        <IncomingBox
          vehiclesAndGhosts={[vehicle]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
          displayCrowding={true}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking an incoming crowding icon selects the associated vehicle", async () => {
    const mockDispatch = jest.fn()

    const vehicle: VehicleInScheduledService = vehicleFactory.build()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <IncomingBox
          vehiclesAndGhosts={[vehicle]}
          ladderDirection={LadderDirection.ZeroToOne}
          selectedVehicleId={undefined}
          displayCrowding={true}
        />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button"))
    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))
  })
})
