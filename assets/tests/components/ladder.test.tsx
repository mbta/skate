import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import Ladder, { LadderDirection } from "../../src/components/ladder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Timepoint, Vehicle } from "../../src/skate"
import { selectVehicle } from "../../src/state"

describe("ladder", () => {
  test("renders a ladder", () => {
    const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
    const vehicles: Vehicle[] = [
      {
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorName: "SMITH",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
      },
      {
        id: "downward",
        label: "downward",
        runId: "run-2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorName: "JONES",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.75,
          timepointId: "t2",
        },
        scheduledLocation: {
          directionId: 0,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
      },
      {
        id: "notimepoint",
        label: "notimepoint",
        runId: "run-3",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op3",
        operatorName: "XI",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: null,
        scheduledLocation: null,
        routeStatus: "on_route",
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehicles={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows schedule line in the other direction", () => {
    const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
    const vehicles: Vehicle[] = [
      {
        id: "downward",
        label: "downward",
        runId: "run-2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorName: "JONES",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.75,
          timepointId: "t2",
        },
        scheduledLocation: {
          directionId: 1,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
      },
    ]
    const ladderDirection = LadderDirection.OneToZero
    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehicles={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("highlights a selected vehicle", () => {
    const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
    const vehicles: Vehicle[] = [
      {
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorName: "SMITH",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
      },
      {
        id: "downward",
        label: "downward",
        runId: "run-2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op2",
        operatorName: "JONES",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.75,
          timepointId: "t2",
        },
        scheduledLocation: {
          directionId: 0,
          timepointStatus: {
            timepointId: "t2",
            fractionUntilTimepoint: 0.75,
          },
        },
        routeStatus: "on_route",
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehicles={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={"upward"}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a vehicle selects that vehicle", () => {
    const mockDispatch = jest.fn()

    const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
    const vehicle: Vehicle = {
      id: "upward",
      label: "upward",
      runId: "run-1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      directionId: 0,
      routeId: "route",
      tripId: "trip",
      headsign: null,
      viaVariant: null,
      operatorId: "op1",
      operatorName: "SMITH",
      bearing: 33,
      speed: 50.0,
      blockId: "block-1",
      headwaySecs: 859.1,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
      scheduleAdherenceString: "0.0 sec (ontime)",
      scheduleAdherenceStatus: "on-time",
      scheduledHeadwaySecs: 120,
      dataDiscrepancies: [],
      stopStatus: {
        status: "in_transit_to",
        stopId: "stop",
        stopName: "stop",
      },
      timepointStatus: {
        fractionUntilTimepoint: 0.5,
        timepointId: "t1",
      },
      scheduledLocation: null,
      routeStatus: "on_route",
    }

    const ladderDirection = LadderDirection.ZeroToOne

    const wrapper = mount(
      <DispatchProvider dispatch={mockDispatch}>
        <Ladder
          timepoints={timepoints}
          vehicles={[vehicle]}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      </DispatchProvider>
    )
    wrapper.find(".m-ladder__vehicle").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle.id))
  })

  test("renders a ladder with no timepoints", () => {
    const timepoints: Timepoint[] = []
    const vehicles: Vehicle[] = [
      {
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 0,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorName: "SMITH",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: null,
        routeStatus: "on_route",
      },
    ]
    const ladderDirection = LadderDirection.ZeroToOne

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehicles={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a reversed ladder", () => {
    const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
    const vehicles: Vehicle[] = [
      {
        id: "upward",
        label: "upward",
        runId: "run-1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        directionId: 1,
        routeId: "route",
        tripId: "trip",
        headsign: null,
        viaVariant: null,
        operatorId: "op1",
        operatorName: "SMITH",
        bearing: 33,
        speed: 50.0,
        blockId: "block-1",
        headwaySecs: 859.1,
        previousVehicleId: "v2",
        scheduleAdherenceSecs: 0,
        scheduleAdherenceString: "0.0 sec (ontime)",
        scheduleAdherenceStatus: "on-time",
        scheduledHeadwaySecs: 120,
        dataDiscrepancies: [],
        stopStatus: {
          status: "in_transit_to",
          stopId: "stop",
          stopName: "stop",
        },
        timepointStatus: {
          fractionUntilTimepoint: 0.5,
          timepointId: "t1",
        },
        scheduledLocation: {
          directionId: 1,
          timepointStatus: {
            timepointId: "t1",
            fractionUntilTimepoint: 0.4,
          },
        },
        routeStatus: "on_route",
      },
    ]
    const ladderDirection = LadderDirection.OneToZero

    const tree = renderer
      .create(
        <Ladder
          timepoints={timepoints}
          vehicles={vehicles}
          ladderDirection={ladderDirection}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
