import { shallow } from "enzyme"
import React from "react"
import { RouteVariantName } from "../../src/components/routeVariantName"
import { Vehicle } from "../../src/realtime"

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
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: null,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduledHeadwaySecs: 120,
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
}

describe("RouteVariantName", () => {
  test("renders for a vehicle with variant and headsign", () => {
    const wrapper = shallow(<RouteVariantName vehicle={vehicle} />)

    expect(wrapper.text()).toEqual("39_X Forest Hills")
  })

  test("renders for a vehicle missing variant and headsign", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      headsign: null,
      viaVariant: null,
    }

    const wrapper = shallow(<RouteVariantName vehicle={testVehicle} />)

    expect(wrapper.text()).toEqual("39_")
  })

  test("doesn't show underscore variant character", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      headsign: null,
      viaVariant: "_",
    }

    const wrapper = shallow(<RouteVariantName vehicle={testVehicle} />)

    expect(wrapper.text()).toEqual("39_")
  })

  test("renders a static label for a shuttle", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      runId: "999-0604",
    }

    const wrapper = shallow(<RouteVariantName vehicle={testVehicle} />)

    expect(wrapper.text()).toEqual("Shuttle")
  })
})
