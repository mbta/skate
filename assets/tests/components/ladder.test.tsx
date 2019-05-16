import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import Ladder, { LadderDirection } from "../../src/components/ladder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Vehicle } from "../../src/skate"
import { selectVehicle } from "../../src/state"

test("renders a ladder", () => {
  const timepoints = [{ id: "t0" }, { id: "t1" }, { id: "t2" }]
  const vehicles: Vehicle[] = [
    {
      id: "upward",
      label: "upward",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "route",
      trip_id: "trip",
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "t1",
        fraction_until_timepoint: 0.5,
      },
    },
    {
      id: "downward",
      label: "downward",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "route",
      trip_id: "trip",
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "t2",
        fraction_until_timepoint: 0.75,
      },
    },
    {
      id: "notimepoint",
      label: "notimepoint",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "route",
      trip_id: "trip",
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
      },
      timepoint_status: null,
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
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "route",
      trip_id: "trip",
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "t1",
        fraction_until_timepoint: 0.5,
      },
    },
    {
      id: "downward",
      label: "downward",
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "route",
      trip_id: "trip",
      stop_status: {
        status: "in_transit_to",
        stop_id: "stop",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "t2",
        fraction_until_timepoint: 0.75,
      },
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
    timestamp: 0,
    latitude: 0,
    longitude: 0,
    direction_id: 1,
    route_id: "route",
    trip_id: "trip",
    stop_status: {
      status: "in_transit_to",
      stop_id: "stop",
    },
    timepoint_status: {
      status: "in_transit_to",
      timepoint_id: "t1",
      fraction_until_timepoint: 0.5,
    },
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
