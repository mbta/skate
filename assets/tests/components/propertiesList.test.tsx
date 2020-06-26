import { shallow } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import PropertiesList, {
  formattedLogonTime,
  Highlighted,
} from "../../src/components/propertiesList"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

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
    timepointId: "tp1",
    fractionUntilTimepoint: 0.5,
  },
  scheduledLocation: null,
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}

describe("PropertiesList", () => {
  test("renders a properties list for a vehicle", () => {
    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a properties list for a ghost", () => {
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

    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={ghost} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a properties list for an overloaded vehicle", () => {
    const overloadedVehicle: Vehicle = {
      ...vehicle,
      isOverload: true,
    }

    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={overloadedVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("highlights requested text", () => {
    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={vehicle} highlightText="run" />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("reports 'Not Available' if missing a login time", () => {
    const vehicleSansLoginTime = {
      ...vehicle,
      operatorLogonTime: null,
    }
    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={vehicleSansLoginTime} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("Highlighted", () => {
  test("renders the content, wrapping the matching text in a span", () => {
    const content: string = "SMITH #20138713820"
    const highlightText: string = "138"

    const expected =
      'SMITH #20<span class="highlighted">138</span>7<span class="highlighted">138</span>20'

    const wrapper = shallow(
      <Highlighted content={content} highlightText={highlightText} />
    )

    expect(wrapper.html()).toEqual(expected)
  })

  test("is insensitive in its matching", () => {
    const content: string = "SMITH #201387 tmits"
    const highlightText: string = "mit"

    const expected =
      'S<span class="highlighted">MIT</span>H #201387 t<span class="highlighted">mit</span>s'

    const wrapper = shallow(
      <Highlighted content={content} highlightText={highlightText} />
    )

    expect(wrapper.html()).toEqual(expected)
  })

  test("ignores spaces and hyphens", () => {
    const content: string = "abcde-f gh"
    const highlightText: string = "b c-defg"
    const expected = 'a<span class="highlighted">bcde-f g</span>h'
    const wrapper = shallow(
      <Highlighted content={content} highlightText={highlightText} />
    )
    expect(wrapper.html()).toEqual(expected)
  })

  test("can highlight the whole string", () => {
    const content: string = "abc"
    const highlightText: string = "abc"
    const expected = '<span class="highlighted">abc</span>'
    const wrapper = shallow(
      <Highlighted content={content} highlightText={highlightText} />
    )
    expect(wrapper.html()).toEqual(expected)
  })

  test("renders the original content if no highlight text is specified", () => {
    const content: string = "SMITH #201387"

    const wrapper = shallow(<Highlighted content={content} />)

    expect(wrapper.html()).toEqual(content)
  })
})

describe("formattedLogonTime", () => {
  test("formats the logon time relative to now, and with the actual time", () => {
    const logonTime = new Date("2018-08-15T13:38:21.000Z")
    const expected = "4 hr 3 min; 1:38 PM"

    expect(formattedLogonTime(logonTime)).toEqual(expected)
  })
})
