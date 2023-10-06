import { jest, describe, test, expect } from "@jest/globals"
import {
  directionName,
  isGhost,
  isLateVehicleIndicator,
  isLoggedOut,
  isRecentlyLoggedOn,
  isVehicleInScheduledService,
} from "../../src/models/vehicle"
import { Ghost, VehicleInScheduledService } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"
import routeFactory from "../factories/route"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2020-03-17T12:00:00.000Z"))

describe("isVehicle", () => {
  test("returns true for a Vehicle", () => {
    expect(isVehicleInScheduledService(vehicleFactory.build())).toBeTruthy()
  })

  test("returns false for a Ghost", () => {
    expect(isVehicleInScheduledService(ghostFactory.build())).toBeFalsy()
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

describe("isLoggedOut", () => {
  test("true if vehicle is logged out", () => {
    const vehicle = vehicleFactory.build({
      operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
      runId: "123-4567",
    })

    expect(isLoggedOut(vehicle)).toBeFalsy()
  })

  test("false if vehicle is logged in", () => {
    const vehicle = vehicleFactory.build({
      operatorLogonTime: null,
      runId: null,
    })

    expect(isLoggedOut(vehicle)).toBeTruthy()
  })
})

describe("isRecentlyLoggedOn", () => {
  test("true if the operatorLogonTime is within the past 30 minutes", () => {
    const recentVehicle = {
      id: "1",
      operatorLogonTime: new Date("2020-03-17T11:31:00.000Z"),
    } as VehicleInScheduledService

    expect(isRecentlyLoggedOn(recentVehicle)).toBeTruthy()
  })

  test("false if the operatorLogonTime is more than 30 minutes ago", () => {
    const oldVehicle = {
      id: "1",
      operatorLogonTime: new Date("2020-03-17T11:29:00.000Z"),
    } as VehicleInScheduledService

    expect(isRecentlyLoggedOn(oldVehicle)).toBeFalsy()
  })

  test("false if operatorLogonTime is null", () => {
    const vehicleMissingLogonTime = {
      id: "1",
      operatorLogonTime: null,
    } as VehicleInScheduledService

    expect(isRecentlyLoggedOn(vehicleMissingLogonTime)).toBeFalsy()
  })

  test("false if given a ghost", () => {
    expect(isRecentlyLoggedOn(ghostFactory.build())).toBeFalsy()
  })
})

describe("directionName", () => {
  test("returns route direction if available", () => {
    const route = routeFactory.build()
    const vehicle = vehicleFactory.build({ routeId: route.id, directionId: 0 })

    expect(directionName(vehicle, route)).toEqual(route.directionNames[0])
  })

  test('returns "N/A" for logged out vehicles', () => {
    const vehicle = vehicleFactory.build({
      runId: null,
      blockId: undefined,
      operatorLogonTime: null,
    })

    expect(directionName(vehicle, null)).toEqual("N/A")
  })

  test("returns empty string otherwise", () => {
    const vehicle = vehicleFactory.build()

    expect(directionName(vehicle, null)).toEqual("")
  })
})
