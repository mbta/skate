import React from "react"
import renderer from "react-test-renderer"
import { render } from "@testing-library/react"
import PropertiesPanel, {
  hideMeIfNoCrowdingTooltip,
} from "../../src/components/propertiesPanel"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime"
import { Route } from "../../src/schedule"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import routeFactory from "../factories/route"
import useVehicleForId from "../../src/hooks/useVehicleForId"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(),
}))

const route: Route = routeFactory.build({
  id: "39",
  name: "39",
})
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
    fractionUntilTimepoint: 0.5,
    timepointId: "tp1",
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

const PropertiesPanelWrapper: React.FC<{ vehicleOrGhost: VehicleOrGhost }> = ({
  vehicleOrGhost,
}) => {
  const routes = [route]

  return (
    <RoutesProvider routes={routes}>
      <PropertiesPanel selectedVehicleOrGhost={vehicleOrGhost} />
    </RoutesProvider>
  )
}

describe("PropertiesPanel", () => {
  test("renders a vehicle", () => {
    const tree = renderer
      .create(<PropertiesPanelWrapper vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a vehicle with updated live information", () => {
    ;(useVehicleForId as jest.Mock).mockImplementationOnce(() => vehicle)

    const result = render(<PropertiesPanelWrapper vehicleOrGhost={vehicle} />)

    expect(result.queryByText(/PATTI/)).not.toBeNull()
  })

  test("renders a ghost", () => {
    const tree = renderer
      .create(<PropertiesPanelWrapper vehicleOrGhost={ghost} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders stale data message", () => {
    ;(useVehicleForId as jest.Mock)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)

    const result = render(<PropertiesPanelWrapper vehicleOrGhost={vehicle} />)

    expect(result.queryByText(/Status data is not available/)).not.toBeNull()
  })
})

describe("hideMeIfNoCrowdingTooltip", () => {
  const originalGetElementsByClassName = document.getElementsByClassName

  afterEach(() => {
    document.getElementsByClassName = originalGetElementsByClassName
  })

  test("hides panel if no tooltip open", () => {
    const hidePanelCB = jest.fn()
    hideMeIfNoCrowdingTooltip(hidePanelCB)

    expect(hidePanelCB).toHaveBeenCalled()
  })

  test("does not hide panel if a tooltip is open", () => {
    const hidePanelCB = jest.fn()
    const newDiv = document.createElement("div")
    // @ts-ignore
    document.getElementsByClassName = () => [newDiv]
    hideMeIfNoCrowdingTooltip(hidePanelCB)

    expect(hidePanelCB).not.toHaveBeenCalled()
  })
})
