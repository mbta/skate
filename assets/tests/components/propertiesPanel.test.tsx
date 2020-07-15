import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import PropertiesPanel, {
  handleSwipe,
  hideMeIfNoCrowdingTooltip,
} from "../../src/components/propertiesPanel"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import { deselectVehicle, initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const route: Route = {
  id: "39",
  directionNames: {
    0: "Outbound",
    1: "Inbound",
  },
  name: "39",
}
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
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
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

describe("PropertiesPanel", () => {
  test("renders a vehicle", () => {
    const tree = renderer
      .create(
        <PropertiesPanel
          selectedVehicleOrGhost={vehicle}
          route={route}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a ghost", () => {
    const tree = renderer
      .create(
        <PropertiesPanel
          selectedVehicleOrGhost={ghost}
          route={route}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking the Close button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <PropertiesPanel
          selectedVehicleOrGhost={ghost}
          route={route}
          routes={[]}
        />
      </StateDispatchProvider>
    )
    wrapper.find(".m-properties-panel__close-button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
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

describe("hideMeIfNoCrowdingTooltip", () => {
  const originalGetElementsByClassName = document.getElementsByClassName

  afterEach(() => {
    document.getElementsByClassName = originalGetElementsByClassName
  })

  test("hides panel if no tooltip open", () => {
    const hidePanelCB = jest.fn()
    hideMeIfNoCrowdingTooltip(hidePanelCB)

    expect(hidePanelCB).toHaveBeenCalled()
  })

  test("does not hide panel if a tooltip is open", () => {
    const hidePanelCB = jest.fn()
    const newDiv = document.createElement("div")
    // @ts-ignore
    document.getElementsByClassName = () => [newDiv]
    hideMeIfNoCrowdingTooltip(hidePanelCB)

    expect(hidePanelCB).not.toHaveBeenCalled()
  })
})
