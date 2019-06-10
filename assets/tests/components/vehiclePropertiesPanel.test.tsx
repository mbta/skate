import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import VehiclePropertiesPanel, {
  formatRouteVariant,
} from "../../src/components/vehiclePropertiesPanel"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Vehicle } from "../../src/skate"
import { deselectVehicle } from "../../src/state"

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
  speed: 50.0,
  bearing: 33,
  blockId: "block-1",
  headwaySecs: 859.1,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduleAdherenceStatus: "on-time",
  scheduledHeadwaySecs: 120,
  stopStatus: {
    status: "in_transit_to",
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    timepointId: "tp1",
    fractionUntilTimepoint: 0.5,
  },
  scheduledTimepointStatus: null,
  routeStatus: "on_route",
}

describe("VehiclePropertiesPanel", () => {
  test("renders a vehicle properties panel", () => {
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking the X close button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <DispatchProvider dispatch={mockDispatch}>
        <VehiclePropertiesPanel selectedVehicle={vehicle} />
      </DispatchProvider>
    )
    wrapper
      .find(".m-vehicle-properties-panel__header .m-close-button")
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
  })

  test("clicking the 'Close vehicle properties' button deselects the vehicle", () => {
    const mockDispatch = jest.fn()

    const wrapper = mount(
      <DispatchProvider dispatch={mockDispatch}>
        <VehiclePropertiesPanel selectedVehicle={vehicle} />
      </DispatchProvider>
    )
    wrapper.find(".m-vehicle-properties-panel__close").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(deselectVehicle())
  })
})

describe("formatRouteVariant", () => {
  test("has variant and headsign", () => {
    expect(formatRouteVariant(vehicle)).toEqual("39_X Forest Hills")
  })

  test("missing variant and headsign", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      headsign: null,
      viaVariant: null,
    }
    expect(formatRouteVariant(testVehicle)).toEqual("39_")
  })

  test("doesn't show underscore variant character", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      headsign: null,
      viaVariant: "_",
    }
    expect(formatRouteVariant(testVehicle)).toEqual("39_")
  })
})
