import React from "react"
import renderer from "react-test-renderer"
import PropertiesPanel, {
  handleSwipe,
} from "../../src/components/propertiesPanel"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const route: Route = {
  id: "39",
  directionNames: {
    0: "Outbound",
    1: "Inbound",
  },
  name: "39",
}

describe("PropertiesPanel", () => {
  test("renders a vehicle", () => {
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
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "v2",
      scheduleAdherenceSecs: 0,
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

    const tree = renderer
      .create(
        <PropertiesPanel selectedVehicleOrGhost={vehicle} route={route} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a ghost", () => {
    const ghost: Ghost = {
      id: "ghost-trip",
      directionId: 0,
      routeId: "39",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: "123-0123",
      viaVariant: "X",
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
    }

    const tree = renderer
      .create(<PropertiesPanel selectedVehicleOrGhost={ghost} route={route} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
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
