import {
  isGhost,
  isLateVehicleIndicator,
  isRecentlyLoggedOn,
  isVehicle,
  shouldShowHeadwayDiagram,
} from "../../src/models/vehicle"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2020-03-17T12:00:00.000Z"))

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => true),
}))

describe("isVehicle", () => {
  test("returns true for a Vehicle", () => {
    expect(isVehicle(vehicleFactory.build())).toBeTruthy()
  })

  test("returns false for a Ghost", () => {
    expect(isVehicle(ghostFactory.build())).toBeFalsy()
  })
})

describe("isGhost", () => {
  test("returns true for a Ghost", () => {
    expect(isGhost(ghostFactory.build())).toBeTruthy()
  })

  test("returns false for a Vehicle", () => {
    expect(isGhost(vehicleFactory.build())).toBeFalsy()
  })
})

describe("isLateVehicleIndicator", () => {
  test("returns true for a late vehicle indicator", () => {
    const lateVehicleIndicatorGhost: Ghost = {
      id: "ghost-incoming-123",
    } as Ghost

    expect(isLateVehicleIndicator(lateVehicleIndicatorGhost)).toBeTruthy()
  })

  test("returns false for a normal ghost", () => {
    const regularGhost: Ghost = {
      id: "ghost-123",
    } as Ghost

    expect(isLateVehicleIndicator(regularGhost)).toBeFalsy()
  })
})

describe("isRecentlyLoggedOn", () => {
  test("true if the operatorLogonTime is within the past 30 minutes", () => {
    const recentVehicle = {
      id: "1",
      operatorLogonTime: new Date("2020-03-17T11:31:00.000Z"),
    } as Vehicle

    expect(isRecentlyLoggedOn(recentVehicle)).toBeTruthy()
  })

  test("false if the operatorLogonTime is more than 30 minutes ago", () => {
    const oldVehicle = {
      id: "1",
      operatorLogonTime: new Date("2020-03-17T11:29:00.000Z"),
    } as Vehicle

    expect(isRecentlyLoggedOn(oldVehicle)).toBeFalsy()
  })

  test("false if operatorLogonTime is null", () => {
    const vehicleMissingLogonTime = {
      id: "1",
      operatorLogonTime: null,
    } as Vehicle

    expect(isRecentlyLoggedOn(vehicleMissingLogonTime)).toBeFalsy()
  })

  test("false if given a ghost", () => {
    expect(isRecentlyLoggedOn(ghostFactory.build())).toBeFalsy()
  })
})

describe("shouldShowHeadwayDiagram", () => {
  test("returns false if vehicle headwaySpacing is null", () => {
    const nullHeadwaySpacingVehicle = {
      headwaySpacing: null,
    } as Vehicle

    expect(shouldShowHeadwayDiagram(nullHeadwaySpacingVehicle)).toBeFalsy()
  })

  test("returns false if not on route", () => {
    const notOnRouteVehicle = {
      headwaySpacing: HeadwaySpacing.Ok,
      routeStatus: "pulling_out",
    } as Vehicle

    expect(shouldShowHeadwayDiagram(notOnRouteVehicle)).toBeFalsy()
  })

  test("returns true if measuring headway spacing and is on route", () => {
    const onRouteHeadwaySpacingVehicle = {
      headwaySpacing: HeadwaySpacing.Ok,
      routeStatus: "on_route",
    } as Vehicle

    expect(shouldShowHeadwayDiagram(onRouteHeadwaySpacingVehicle)).toBeTruthy()
  })
})
