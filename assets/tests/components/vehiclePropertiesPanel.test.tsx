import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import VehiclePropertiesPanel, {
  formatRouteVariant,
  handleSwipe,
} from "../../src/components/vehiclePropertiesPanel"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { TripsByIdProvider } from "../../src/contexts/tripsByIdContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime.d"
import { Route, Trip } from "../../src/schedule"
import { deselectVehicle, initialState } from "../../src/state"

jest.spyOn(Date, "now").mockImplementation(() => 234000)

// Enable feature flags for "renders for a headway-based vehicle" test
jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest
    .fn()
    // Ipmlementation sequence matches tests
    .mockImplementation(() => true),
}))

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
  bearing: 33,
  speed: 50.0,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduleAdherenceStatus: "on-time",
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
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
    status: "in_transit_to",
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "tp1",
  },
  scheduledLocation: null,
  isOnRoute: true,
}

describe("VehiclePropertiesPanel", () => {
  test("renders a vehicle properties panel", () => {
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders vehicle with properties from its trip", () => {
    const trip: Trip = {
      id: "t1",
      routeId: "39",
      headsign: "Forest Hills",
      directionId: 0,
      blockId: "block-1",
      routePatternId: "39-X-1",
      stopTimes: [],
    }
    const tree = renderer
      .create(
        <TripsByIdProvider tripsById={{ ["t1"]: trip }}>
          <VehiclePropertiesPanel selectedVehicle={vehicle} />
        </TripsByIdProvider>
      )
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
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={vehicle}
          selectedVehicleRoute={route}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an early vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: -61,
      scheduleAdherenceStatus: "early",
    }
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={earlyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
      scheduleAdherenceStatus: "late",
    }
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={earlyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an off-course vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      isOffCourse: true,
    }

    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={offCourseVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a headway-based vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      headwaySpacing: HeadwaySpacing.Ok,
    }

    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={offCourseVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders data discrepancies when in debug mode", () => {
    jest.spyOn(URLSearchParams.prototype, "get").mockImplementation(_key => "1")

    const wrapper = mount(<VehiclePropertiesPanel selectedVehicle={vehicle} />)

    expect(
      wrapper.find(".m-vehicle-properties-panel__data-discrepancies").length
    ).toBeGreaterThan(0)
  })

  test("does not render data discrepancies when not in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation(_key => null)

    const wrapper = mount(<VehiclePropertiesPanel selectedVehicle={vehicle} />)

    expect(
      wrapper.find(".m-vehicle-properties-panel__data-discrepancies").length
    ).toBe(0)
  })

  test("clicking the X close button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <VehiclePropertiesPanel selectedVehicle={vehicle} />
      </StateDispatchProvider>
    )
    wrapper
      .find(".m-vehicle-properties-panel__header .m-close-button")
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
  })

  test("clicking the 'Close vehicle properties' button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <VehiclePropertiesPanel selectedVehicle={vehicle} />
      </StateDispatchProvider>
    )
    wrapper.find(".m-vehicle-properties-panel__close").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
  })
})

describe("formatRouteVariant", () => {
  test("has variant and headsign", () => {
    const trip: Trip = {
      id: "t1",
      routeId: "39",
      headsign: "Forest Hills",
      directionId: 0,
      blockId: "block-1",
      routePatternId: "39-X-1",
      stopTimes: [],
    }
    expect(formatRouteVariant(trip)).toEqual("39_X Forest Hills")
  })

  test("missing variant", () => {
    const trip: Trip = {
      id: "t1",
      routeId: "39",
      headsign: "Forest Hills",
      directionId: 0,
      blockId: "block-1",
      routePatternId: null,
      stopTimes: [],
    }
    expect(formatRouteVariant(trip)).toEqual("39_ Forest Hills")
  })

  test("doesn't show underscore variant character", () => {
    const trip: Trip = {
      id: "t1",
      routeId: "39",
      headsign: "Forest Hills",
      directionId: 0,
      blockId: "block-1",
      routePatternId: "39-_-1",
      stopTimes: [],
    }
    expect(formatRouteVariant(trip)).toEqual("39_ Forest Hills")
  })
})

describe("handleSwipe", () => {
  test("hides the panel on a right swipe", () => {
    const hidePanelCB = jest.fn()

    handleSwipe(hidePanelCB)("Right", null)
    expect(hidePanelCB).toHaveBeenCalled()
  })

  test("does not hide panel on other swipes", () => {
    const hidePanelCB = jest.fn()
    const handler = handleSwipe(hidePanelCB)
    handler("Left", null)
    handler("Up", null)
    handler("Down", null)

    expect(hidePanelCB).not.toHaveBeenCalled()
  })

  test("does not hide panel when map is swiped right", () => {
    const hidePanelCB = jest.fn()
    const map = document.createElement("div")
    map.id = "id-vehicle-map"
    handleSwipe(hidePanelCB)("Right", map)
  })
})
