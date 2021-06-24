import { shallow, mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import PropertiesList, {
  formattedLogonTime,
  ghostProperties,
  Highlighted,
  vehicleOrGhostProperties,
  vehicleProperties,
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
  operatorFirstName: "PATTI",
  operatorLastName: "SMITH",
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
  isRevenue: true,
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
  scheduledLogonTime: null,
  routeStatus: "on_route",
  blockWaivers: [],
}

describe("PropertiesList", () => {
  test("renders generic properties", () => {
    const properties = [
      { label: "Label 1", value: "Value 1" },
      { label: "Label 2", value: "Value 2" },
    ]
    const tree = renderer
      .create(<PropertiesList properties={properties} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a properties list for a vehicle", () => {
    const tree = renderer
      .create(<PropertiesList properties={vehicleProperties(vehicle)} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a properties list for a ghost", () => {
    const tree = renderer
      .create(<PropertiesList properties={ghostProperties(ghost)} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("highlights requested text", () => {
    const tree = renderer
      .create(
        <PropertiesList
          properties={vehicleOrGhostProperties(vehicle)}
          highlightText="run"
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("ignores properties with null values", () => {
    const wrapper = mount(
      <PropertiesList
        properties={[
          {
            label: "Label",
            value: null,
          },
        ]}
        highlightText="run"
      />
    )

    expect(wrapper.html()).not.toContain("Label")
  })
})

describe("vehicleOrGhostProperties", () => {
  test("uses vehicle properties for vehicles", () => {
    expect(vehicleOrGhostProperties(vehicle)).toEqual(
      vehicleProperties(vehicle)
    )
  })

  test("uses ghost properties for ghosts", () => {
    expect(vehicleOrGhostProperties(ghost)).toEqual(ghostProperties(ghost))
  })
})

describe("vehicleProperties", () => {
  test("an overloaded vehicle's run has 'ADDED'", () => {
    const overloadedVehicle: Vehicle = {
      ...vehicle,
      isOverload: true,
    }
    const properties = vehicleProperties(overloadedVehicle)
    expect(properties.find((prop) => prop.label === "Run")!.value).toContain(
      "ADDED"
    )
  })

  test("login time is 'Not Available' if missing a login time", () => {
    const vehicleSansLoginTime = {
      ...vehicle,
      operatorLogonTime: null,
    }
    const properties = vehicleProperties(vehicleSansLoginTime)

    expect(
      properties.find((prop) => prop.label === "Last Login")!.value
    ).toEqual("Not Available")
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
