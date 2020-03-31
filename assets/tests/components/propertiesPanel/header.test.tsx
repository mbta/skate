import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import Header from "../../../src/components/propertiesPanel/header"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import {
  emptyLadderDirectionsByRouteId,
  flipLadderDirectionForRoute,
  LadderDirections,
} from "../../../src/models/ladderDirection"
import { HeadwaySpacing } from "../../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import { deselectVehicle, initialState } from "../../../src/state"

const vehicle: Vehicle = {
  id: "v1",
  label: "v1-label",
  runId: "run-1",
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "39",
  tripId: "t1",
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: "op1",
  operatorName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: null,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduledHeadwaySecs: 120,
  isShuttle: false,
  isOffCourse: false,
  layoverDepartureTime: null,
  blockIsActive: false,
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
}

describe("Header", () => {
  test("renders a header", () => {
    const tree = renderer
      .create(<Header vehicle={vehicle} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with route data", () => {
    const route: Route = {
      id: "39",
      directionNames: {
        0: "Outbound",
        1: "Inbound",
      },
      name: "39",
    }
    const tree = renderer
      .create(<Header vehicle={vehicle} route={route} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an early vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: -61,
    }
    const tree = renderer
      .create(<Header vehicle={earlyVehicle} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
    }
    const tree = renderer
      .create(<Header vehicle={earlyVehicle} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an off-course vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      isOffCourse: true,
    }

    const tree = renderer
      .create(<Header vehicle={offCourseVehicle} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a headway-based vehicle", () => {
    const headwayVehicle: Vehicle = {
      ...vehicle,
      headwaySpacing: HeadwaySpacing.Ok,
    }

    const tree = renderer
      .create(<Header vehicle={headwayVehicle} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a shuttle", () => {
    const shuttleVehicle: Vehicle = {
      ...vehicle,
      isShuttle: true,
    }

    const tree = renderer
      .create(<Header vehicle={shuttleVehicle} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a ghost", () => {
    const ghost: Ghost = {
      id: "ghost-trip",
      directionId: 0,
      routeId: "39",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: "X",
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
    }

    const tree = renderer
      .create(<Header vehicle={ghost} route={undefined} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders pointing sideways for a laying over vehicle", () => {
    const rightFacing = mount(
      <Header
        vehicle={{ ...vehicle, directionId: 0, routeStatus: "laying_over" }}
        route={undefined}
      />
    )
    const leftFacing = mount(
      <Header
        vehicle={{ ...vehicle, directionId: 1, routeStatus: "laying_over" }}
        route={undefined}
      />
    )

    const rightFacingTransform = rightFacing
      .find(".m-vehicle-icon")
      .find("path")
      .getDOMNode()
      .getAttribute("transform")
    expect(rightFacingTransform).toEqual(expect.stringContaining("rotate(90)"))

    const leftFacingTransform = leftFacing
      .find(".m-vehicle-icon")
      .find("path")
      .getDOMNode()
      .getAttribute("transform")
    expect(leftFacingTransform).toEqual(expect.stringContaining("rotate(270)"))
  })

  test("renders a vehicle that's moving down on the ladder as pointing down", () => {
    const ladderDirections: LadderDirections = flipLadderDirectionForRoute(
      emptyLadderDirectionsByRouteId,
      vehicle.routeId!
    )

    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, ladderDirections }}
        dispatch={jest.fn()}
      >
        <Header vehicle={vehicle} route={undefined} />
      </StateDispatchProvider>
    )

    const transform = wrapper
      .find(".m-vehicle-icon")
      .find("path")
      .getDOMNode()
      .getAttribute("transform")
    expect(transform).toEqual(expect.stringContaining("rotate(180)"))
  })

  test("renders a shuttle triangle as pointing up", () => {
    const shuttleVehicle: Vehicle = {
      ...vehicle,
      runId: "999-0555",
      routeId: null,
      tripId: null,
    }
    const wrapper = mount(<Header vehicle={shuttleVehicle} route={undefined} />)

    const transform = wrapper
      .find(".m-vehicle-icon")
      .find("path")
      .getDOMNode()
      .getAttribute("transform")
    expect(transform).toEqual(expect.stringContaining("rotate(0)"))
  })

  test("clicking the X close button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <Header vehicle={vehicle} route={undefined} />
      </StateDispatchProvider>
    )
    wrapper
      .find(".m-properties-panel__header .m-close-button")
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
  })
})
