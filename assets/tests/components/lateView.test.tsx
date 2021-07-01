import React from "react"
import renderer from "react-test-renderer"
import LateView from "../../src/components/lateView"
import useVehicles from "../../src/hooks/useVehicles"
import { VehicleOrGhost } from "../../src/realtime"
import { ByRouteId } from "../../src/schedule"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"

jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.spyOn(Date, "now").mockImplementation(() => {
  return 18000 * 1000
})

describe("LateView", () => {
  test("renders missing logons and late buses", () => {
    ;(useVehicles as jest.Mock).mockImplementationOnce(
      (): ByRouteId<VehicleOrGhost[]> => ({
        ["route"]: [
          vehicleFactory.build({ routeId: "route", scheduleAdherenceSecs: 0 }),
          vehicleFactory.build({
            routeId: "route",
            scheduleAdherenceSecs: 901,
          }),
          ghostFactory.build({
            routeId: "route",
            scheduledLogonTime: 15299,
            currentPieceFirstRoute: "route",
            currentPieceStartPlace: "garage",
          }),
          ghostFactory.build({
            routeId: "route",
            scheduledLogonTime: 15301,
            currentPieceFirstRoute: "route",
            currentPieceStartPlace: "station",
          }),
        ],
      })
    )

    const tree = renderer.create(<LateView />)
    expect(tree).toMatchSnapshot()
  })
})
