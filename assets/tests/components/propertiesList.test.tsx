import { shallow } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import PropertiesList, {
  Highlighted,
} from "../../src/components/propertiesList"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"

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
    timepointId: "tp1",
    fractionUntilTimepoint: 0.5,
  },
  scheduledLocation: null,
  routeStatus: "on_route",
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
      scheduledTimepointStatus: {
        timepointId: "t0",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
    }

    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={ghost} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("highlights requested text", () => {
    const tree = renderer
      .create(<PropertiesList vehicleOrGhost={vehicle} highlightText="run" />)
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
