import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import HeadwayDiagram from "../../../src/components/propertiesPanel/headwayDiagram"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { HeadwaySpacing } from "../../../src/models/vehicleStatus"
import { Vehicle } from "../../../src/realtime"
import { initialState, selectVehicle } from "../../../src/state"

const vehicle: Vehicle = {
  id: "y1804",
  label: "1804",
  runId: "123-1097",
  timestamp: 1564432015,
  latitude: 42.34967,
  longitude: -71.08902,
  directionId: 1,
  routeId: "1",
  tripId: "40667775",
  headsign: "Dudley",
  viaVariant: "_",
  operatorId: "68760",
  operatorName: "SANDERS",
  bearing: 160.1,
  blockId: "C01-10",
  headwaySecs: 218.8,
  headwaySpacing: HeadwaySpacing.Bunched,
  previousVehicleId: "y1750",
  scheduleAdherenceSecs: -305,
  scheduledHeadwaySecs: 480,
  isOffCourse: false,
  layoverDepartureTime: null,
  blockIsActive: true,
  dataDiscrepancies: [],
  stopStatus: {
    stopId: "77",
    stopName: "Massachusetts Ave @ Marlborough St",
  },
  timepointStatus: { timepointId: "hynes", fractionUntilTimepoint: 0.5 },
  scheduledLocation: {
    routeId: "1",
    directionId: 1,
    tripId: "scheduled trip",
    runId: "scheduled run",
    timeSinceTripStartTime: 0,
    headsign: "scheduled headsign",
    viaVariant: "scheduled via variant",
    timepointStatus: {
      timepointId: "hynes",
      fractionUntilTimepoint: 0.7574074074074074,
    },
  },
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}

jest.mock("../../../src/models/vehiclesByRouteId", () => ({
  allVehiclesForRoute: jest.fn(),
  nextAndPreviousVehicle: jest
    .fn()
    // Ipmlementation sequence matches
    .mockImplementationOnce(() => ({}))
    .mockImplementation(() => ({
      nextVehicle: vehicle,
      previousVehicle: vehicle,
    })),
}))

describe("HeadwayDiagram", () => {
  test("renders with no next or previous vehicles", () => {
    const tree = renderer.create(<HeadwayDiagram vehicle={vehicle} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with next and previous vehicles", () => {
    const tree = renderer.create(<HeadwayDiagram vehicle={vehicle} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a gapped vehicle", () => {
    const gappedVehicle: Vehicle = {
      id: "y1889",
      label: "1889",
      runId: "123-1166",
      timestamp: 1564433508,
      latitude: 42.36483,
      longitude: -71.10282,
      directionId: 1,
      routeId: "1",
      tripId: "40667769",
      headsign: "Dudley",
      viaVariant: "_",
      operatorId: "72221",
      operatorName: "SULLIVAN",
      bearing: 128.8,
      blockId: "C01-21",
      headwaySecs: 1071.4,
      headwaySpacing: HeadwaySpacing.Gapped,
      previousVehicleId: "y1798",
      scheduleAdherenceSecs: 408,
      scheduledHeadwaySecs: 540,
      isOffCourse: false,
      layoverDepartureTime: null,
      blockIsActive: true,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "72",
        stopName: "Massachusetts Ave @ Pearl St",
      },
      timepointStatus: { timepointId: "cntsq", fractionUntilTimepoint: 0 },
      scheduledLocation: {
        routeId: "1",
        directionId: 1,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "mit",
          fractionUntilTimepoint: 0.004761904761904762,
        },
      },
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [],
    }

    const tree = renderer
      .create(<HeadwayDiagram vehicle={gappedVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders an ok headway vehicle", () => {
    const okVehicle: Vehicle = {
      id: "y1780",
      label: "1780",
      runId: "123-1164",
      timestamp: 1564433053,
      latitude: 42.31352,
      longitude: -71.09551,
      directionId: 0,
      routeId: "22",
      tripId: "40666902",
      headsign: "Ashmont",
      viaVariant: "_",
      operatorId: "72730",
      operatorName: "NICHOLAS",
      bearing: 133.9,
      blockId: "C22-196",
      headwaySecs: 1033.7,
      headwaySpacing: HeadwaySpacing.Ok,
      previousVehicleId: "y1894",
      scheduleAdherenceSecs: 313,
      scheduledHeadwaySecs: 600,
      isOffCourse: false,
      layoverDepartureTime: null,
      blockIsActive: true,
      dataDiscrepancies: [],
      stopStatus: {
        stopId: "11413",
        stopName: "Columbus Ave @ Walnut Ave",
      },
      timepointStatus: { timepointId: "svrhm", fractionUntilTimepoint: 0.5 },
      scheduledLocation: {
        routeId: "22",
        directionId: 0,
        tripId: "scheduled trip",
        runId: "scheduled run",
        timeSinceTripStartTime: 0,
        headsign: "scheduled headsign",
        viaVariant: "scheduled via variant",
        timepointStatus: {
          timepointId: "frnpk",
          fractionUntilTimepoint: 0.10416666666666667,
        },
      },
      routeStatus: "on_route",
      endOfTripType: "another_trip",
      blockWaivers: [],
    }

    const tree = renderer
      .create(<HeadwayDiagram vehicle={okVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a next or previous vehicle icon selects that vehicle", () => {
    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <HeadwayDiagram vehicle={vehicle} />
      </StateDispatchProvider>
    )
    wrapper
      .find(".m-headway-diagram__other-vehicle")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle.id))
  })
})
