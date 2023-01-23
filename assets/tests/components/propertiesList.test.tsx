import React from "react"
import renderer from "react-test-renderer"
import PropertiesList, {
  formattedLogonTime,
  ghostProperties,
  Highlighted,
  vehicleOrGhostProperties,
  vehicleProperties,
} from "../../src/components/propertiesList"
import { Ghost, Vehicle } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import { render } from "@testing-library/react"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

const vehicle: Vehicle = vehicleFactory.build({
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
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
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
})

const ghost: Ghost = ghostFactory.build({
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
})

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
    const result = render(
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

    expect(result.queryByText("Label")).toBeNull()
  })
})

describe("vehicleOrGhostProperties", () => {
  test("uses vehicle properties for vehicles", () => {
    expect(vehicleOrGhostProperties(vehicle)).toEqual(
      vehicleProperties(vehicle)
    )
  })

  test("uses vehicle properties for vehicles, operator last name only", () => {
    expect(vehicleOrGhostProperties(vehicle, true)).toEqual(
      vehicleProperties(vehicle, true)
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

  test("operator information is 'Not Available' if all fields are missing", () => {
    /* The type for Vehicle doesn't actually allow nulls, but the way we coerce values we
     *  receive from the backend doesn't account for this fact. One more reason to adopt
     *  Superstruct to handle the translation of data from the backend to JS values. */
    const vehicleSansOperator = {
      ...vehicle,
      operatorId: null,
      operatorFirstName: null,
      operatorLastName: null,
    } as unknown

    const properties = vehicleProperties(vehicleSansOperator as Vehicle)

    expect(properties.find((prop) => prop.label === "Operator")!.value).toEqual(
      "Not Available"
    )
  })

  test("operator information gives last name if that's all that's available", () => {
    const vehicleSansOperator = {
      ...vehicle,
      operatorId: "1234",
      operatorFirstName: null,
      operatorLastName: "SMITH",
    } as unknown

    const properties = vehicleProperties(vehicleSansOperator as Vehicle)

    expect(properties.find((prop) => prop.label === "Operator")!.value).toEqual(
      "SMITH #1234"
    )
  })

  test("operator information gives last name if that's all that's available", () => {
    const properties = vehicleProperties(
      vehicleFactory.build({
        operatorFirstName: "JOHN",
        operatorLastName: "SMITH",
        operatorId: "1234",
      }),
      true
    )

    expect(properties.find((prop) => prop.label === "Operator")!.value).toEqual(
      "SMITH #1234"
    )
  })

  test("operator information is marked sensitive", () => {
    const vehicle = vehicleFactory.build()

    const properties = vehicleProperties(vehicle)

    expect(
      properties.find((prop) => prop.label === "Operator")!.sensitive
    ).toBe(true)
  })
})

describe("Highlighted", () => {
  test("renders the content, wrapping the matching text in a span", () => {
    const content = "SMITH #20138713820"
    const highlightText = "138"

    const tree = renderer.create(
      <Highlighted content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("is insensitive in its matching", () => {
    const content = "SMITH #201387 tmits"
    const highlightText = "mit"

    const tree = renderer.create(
      <Highlighted content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("ignores spaces and hyphens", () => {
    const content = "abcde-f gh"
    const highlightText = "b c-defg"
    const tree = renderer.create(
      <Highlighted content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("can highlight the whole string", () => {
    const content = "abc"
    const highlightText = "abc"
    const tree = renderer.create(
      <Highlighted content={content} highlightText={highlightText} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("renders the original content if no highlight text is specified", () => {
    const content = "SMITH #201387"

    const tree = renderer.create(<Highlighted content={content} />)

    expect(tree).toMatchSnapshot()
  })
})

describe("formattedLogonTime", () => {
  test("formats the logon time relative to now, and with the actual time", () => {
    const logonTime = new Date("2018-08-15T13:38:21.000Z")
    const expected = "4 hr 3 min; 1:38 PM"

    expect(formattedLogonTime(logonTime)).toEqual(expected)
  })
})
