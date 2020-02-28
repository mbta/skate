import React from "react"
import renderer from "react-test-renderer"
import HeadwayLines from "../../src/components/headwayLines"
import { VehicleDirection } from "../../src/models/ladderDirection"
import { LadderVehicle } from "../../src/models/ladderVehicle"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"

describe("HeadwayLines", () => {
  test("renders", () => {
    const vehicles: LadderVehicle[] = [
      {
        vehicle: {
          id: "1",
          label: "1",
          headwaySpacing: HeadwaySpacing.Ok,
        } as Vehicle,
        x: 1,
        y: 1,
        vehicleDirection: VehicleDirection.Up,
      },
      {
        vehicle: {
          id: "2",
          label: "2",
          headwaySpacing: HeadwaySpacing.Bunched,
        } as Vehicle,
        x: 1,
        y: 100,
        vehicleDirection: VehicleDirection.Up,
      },
      {
        vehicle: {
          id: "3",
          label: "3",
          headwaySpacing: HeadwaySpacing.Gapped,
        } as Vehicle,
        x: 1,
        y: 300,
        vehicleDirection: VehicleDirection.Down,
      },
    ]
    const tree = renderer
      .create(<HeadwayLines height={800} ladderVehicles={vehicles} />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
