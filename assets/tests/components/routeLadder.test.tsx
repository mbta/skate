import { mount } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route, Vehicle } from "../../src/skate"
import { deselectRoute, selectVehicle } from "../../src/state"

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const tree = renderer
    .create(<RouteLadder route={route} timepoints={timepoints} vehicles={[]} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders a route ladder with vehicles", () => {
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]
  const vehicles: Vehicle[] = [
    {
      id: "y1818",
      label: "1818",
      timestamp: 1557160307,
      latitude: 0,
      longitude: 0,
      direction_id: 0,
      route_id: "1",
      trip_id: "39914237",
      stop_status: {
        status: "in_transit_to",
        stop_id: "57",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "MATPN",
        fraction_until_timepoint: 0.5,
      },
    },
    {
      id: "y0479",
      label: "0479",
      timestamp: 1557160347,
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "1",
      trip_id: "39914128",
      stop_status: {
        status: "in_transit_to",
        stop_id: "59",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "MORTN",
        fraction_until_timepoint: 0.0,
      },
    },
  ]

  const tree = renderer
    .create(
      <RouteLadder route={route} timepoints={timepoints} vehicles={vehicles} />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("displays loading if we are fetching the timepoints", () => {
  const route: Route = { id: "28" }
  const timepoints = null

  const tree = renderer
    .create(<RouteLadder route={route} timepoints={timepoints} vehicles={[]} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("clicking the close button deselects that route", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const wrapper = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RouteLadder route={route} timepoints={timepoints} vehicles={[]} />
    </DispatchProvider>
  )
  wrapper.find(".m-route-ladder__header .m-close-button").simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
})

test("clicking the reverse button reverses the order of the timepoints", () => {
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const wrapper = mount(
    <RouteLadder route={route} timepoints={timepoints} vehicles={[]} />
  )
  act(() => {
    wrapper.find(".m-route-ladder__reverse").simulate("click")
  })

  expect(
    wrapper.find(".m-ladder__timepoint-name").map(node => node.text())
  ).toEqual(["MORTN", "WELLH", "MATPN"])
})

test("clicking a vehicle selects that vehicle", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]
  const vehicle: Vehicle = {
    id: "v1",
    label: "v1-label",
    timestamp: 123,
    latitude: 0,
    longitude: 0,
    direction_id: 0,
    route_id: "r1",
    trip_id: "t1",
    stop_status: {
      status: "in_transit_to",
      stop_id: "s1",
    },
    timepoint_status: {
      status: "in_transit_to",
      timepoint_id: "tp1",
      fraction_until_timepoint: 0.5,
    },
  }

  const wrapper = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RouteLadder route={route} timepoints={timepoints} vehicles={[vehicle]} />
    </DispatchProvider>
  )
  wrapper.find(".m-route-ladder__vehicle").simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle.id))
})
