import { mount, shallow } from "enzyme"
import React from "react"
import { RouteVariantName } from "../../src/components/routeVariantName"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"

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
      isShuttle: true,
    }

    const wrapper = shallow(<RouteVariantName vehicle={testVehicle} />)

    expect(wrapper.text()).toEqual("Shuttle")
  })

  test("uses route name if available", () => {
    const route: Route = {
      id: "39",
      directionNames: { "0": "Outbound", "1": "Inbound" },
      name: "ThirtyNine",
    }

    const wrapper = mount(
      <RoutesProvider routes={[route]}>
        <RouteVariantName vehicle={vehicle} />
      </RoutesProvider>
    )
    expect(wrapper.text()).toEqual("ThirtyNine_X Forest Hills")
  })
})
