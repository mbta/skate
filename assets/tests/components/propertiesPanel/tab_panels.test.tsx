import React from "react"
import renderer from "react-test-renderer"
import TabPanels from "../../../src/components/propertiesPanel/tabPanels"
import { Vehicle } from "../../../src/realtime"

const vehicle: Vehicle = {
  id: "vehicleId",
  label: "",
  runId: "123-4567",
  timestamp: 1590828502,
  latitude: 42.38274,
  longitude: -71.86523,
  directionId: 0,
  routeId: "1",
  tripId: "44444444",
  headsign: "Harvard",
  viaVariant: "_",
  operatorId: "99999",
  operatorName: "CHARLIE",
  operatorLogonTime: null,
  bearing: 143.7,
  blockId: "C12-34",
  headwaySecs: 385.8,
  headwaySpacing: null,
  previousVehicleId: "y4321",
  scheduleAdherenceSecs: 35,
  scheduledHeadwaySecs: 40,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
  layoverDepartureTime: null,
  dataDiscrepancies: [],
  stopStatus: { stopId: "93", stopName: "Massachusetts Ave @ Newbury St" },
  timepointStatus: {
    timepointId: "hynes",
    fractionUntilTimepoint: 0.13316513898674723,
  },
  scheduledLocation: {
    routeId: "1",
    directionId: 0,
    tripId: "44444444",
    runId: "123-1408",
    timeSinceTripStartTime: 940,
    headsign: "Harvard",
    viaVariant: "_",
    timepointStatus: {
      timepointId: "hynes",
      fractionUntilTimepoint: 0.6666666666666666,
    },
  },
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}

describe("TabPanels", () => {
  test("renders the status tab", () => {
    const tree = renderer
      .create(
        <TabPanels
          statusContent={<>Test content</>}
          vehicleOrGhost={vehicle}
          mode="status"
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders the run tab", () => {
    const tree = renderer
      .create(
        <TabPanels
          statusContent={<>Test content</>}
          vehicleOrGhost={vehicle}
          mode="run"
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders the block tab", () => {
    const tree = renderer
      .create(
        <TabPanels
          statusContent={<>Test content</>}
          vehicleOrGhost={vehicle}
          mode="block"
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
