import { mount } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route, Vehicle } from "../../src/skate"
import { deselectRoute } from "../../src/state"

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
      direction_id: 0,
      id: "y1818",
      label: "1818",
      route_id: "1",
      stop_status: {
        status: "in_transit_to",
        stop_id: "57",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "MATPN",
        percent_of_the_way_to_timepoint: 50,
      },
      timestamp: 1557160307,
      trip_id: "39914237",
    },
    {
      direction_id: 1,
      id: "y0479",
      label: "0479",
      route_id: "1",
      stop_status: {
        status: "in_transit_to",
        stop_id: "59",
      },
      timepoint_status: {
        status: "in_transit_to",
        timepoint_id: "MORTN",
        percent_of_the_way_to_timepoint: 100,
      },
      timestamp: 1557160347,
      trip_id: "39914128",
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
  wrapper.find(".m-route-ladder__close").simulate("click")

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
    wrapper.find(".m-route-ladder__timepoint-name").map(node => node.text())
  ).toEqual(["MORTN", "WELLH", "MATPN"])
})
