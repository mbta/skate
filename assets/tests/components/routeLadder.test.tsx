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
    .create(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehicles={[]}
        selectedVehicleId={undefined}
      />
    )
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
      headsign: "h0",
      via_variant: "4",
      stop_status: {
        status: "in_transit_to",
        stop_id: "57",
      },
      timepoint_status: {
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
      headsign: null,
      via_variant: null,
      stop_status: {
        status: "in_transit_to",
        stop_id: "59",
      },
      timepoint_status: {
        timepoint_id: "MORTN",
        fraction_until_timepoint: 0.0,
      },
    },
  ]

  const tree = renderer
    .create(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehicles={vehicles}
        selectedVehicleId={undefined}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("displays loading if we are fetching the timepoints", () => {
  const route: Route = { id: "28" }
  const timepoints = null

  const tree = renderer
    .create(
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehicles={[]}
        selectedVehicleId={undefined}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("clicking the close button deselects that route", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const wrapper = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RouteLadder
        route={route}
        timepoints={timepoints}
        vehicles={[]}
        selectedVehicleId={undefined}
      />
    </DispatchProvider>
  )
  wrapper.find(".m-route-ladder__header .m-close-button").simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
})

test("clicking the reverse button reverses the order of the timepoints", () => {
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const wrapper = mount(
    <RouteLadder
      route={route}
      timepoints={timepoints}
      vehicles={[]}
      selectedVehicleId={undefined}
    />
  )
  act(() => {
    wrapper.find(".m-route-ladder__reverse").simulate("click")
  })

  expect(
    wrapper.find(".m-ladder__timepoint-name").map(node => node.text())
  ).toEqual(["MORTN", "WELLH", "MATPN"])
})
