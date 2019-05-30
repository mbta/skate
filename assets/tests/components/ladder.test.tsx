import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import Ladder, { LadderDirection } from "../../src/components/ladder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Timepoint, Vehicle } from "../../src/skate"
import { selectVehicle } from "../../src/state"

test("renders a ladder", () => {
  const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
  const vehicles: Vehicle[] = [
    {
      id: "upward",
      label: "upward",
      run_id: "run-1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "route",
      trip_id: "trip",
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
        stop_name: "stop",
      },
      timepoint_status: {
        timepoint_id: "t1",
        fraction_until_timepoint: 0.5,
      },
      route_status: "on_route",
    },
    {
      id: "downward",
      label: "downward",
      run_id: "run-2",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "route",
      trip_id: "trip",
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
        stop_name: "stop",
      },
      timepoint_status: {
        timepoint_id: "t2",
        fraction_until_timepoint: 0.75,
      },
      route_status: "on_route",
    },
    {
      id: "notimepoint",
      label: "notimepoint",
      run_id: "run-3",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "route",
      trip_id: "trip",
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
        stop_name: "stop",
      },
      timepoint_status: null,
      route_status: "on_route",
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
      run_id: "run-1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "route",
      trip_id: "trip",
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
        stop_name: "stop",
      },
      timepoint_status: {
        timepoint_id: "t1",
        fraction_until_timepoint: 0.5,
      },
      route_status: "on_route",
    },
    {
      id: "downward",
      label: "downward",
      run_id: "run-2",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "route",
      trip_id: "trip",
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
        stop_name: "stop",
      },
      timepoint_status: {
        timepoint_id: "t2",
        fraction_until_timepoint: 0.75,
      },
      route_status: "incoming",
    },
  ]
  const ladderDirection = LadderDirection.OneToZero

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
    run_id: "run-1",
    timestamp: 0,
    latitude: 0,
    longitude: 0,
    direction_id: 1,
    route_id: "route",
    trip_id: "trip",
    headsign: null,
    via_variant: null,
    stop_status: {
      status: "in_transit_to",
      stop_id: "stop",
      stop_name: "stop",
    },
    timepoint_status: {
      timepoint_id: "t1",
      fraction_until_timepoint: 0.5,
    },
    route_status: "on_route",
  }

  const ladderDirection = LadderDirection.OneToZero

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
      run_id: "run-1",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "route",
      trip_id: "trip",
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
        stop_name: "stop",
      },
      timepoint_status: null,
      route_status: "on_route",
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
