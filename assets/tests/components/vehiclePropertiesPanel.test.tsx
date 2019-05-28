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
  run_id: "run-1",
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  direction_id: 0,
  route_id: "r1",
  trip_id: "t1",
  headsign: "headsign",
  via_variant: "4",
  operator_id: "op1",
  operator_name: "SMITH",
  stop_status: {
    status: "in_transit_to",
    stop_id: "s1",
    stop_name: "Stop Name",
  },
  timepoint_status: {
    timepoint_id: "tp1",
    fraction_until_timepoint: 0.5,
  },
  route_status: "on_route",
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
    expect(formatRouteVariant("39", "X", "Forest Hills")).toEqual(
      "39_X Forest Hills"
    )
  })

  test("missing variant and headsign", () => {
    expect(formatRouteVariant("39", null, null)).toEqual("39_")
  })

  test("doesn't show underscore variant character", () => {
    expect(formatRouteVariant("39", "_", null)).toEqual("39_")
  })
})
