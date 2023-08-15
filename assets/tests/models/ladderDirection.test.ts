import { describe, test, expect } from "@jest/globals"
import {
  directionOnLadder,
  flipLadderDirectionForRoute,
  LadderDirection,
  VehicleDirection,
} from "../../src/models/ladderDirection"

describe("flipLadderDirectionForRoute", () => {
  test("flips ZeroToOne to OneToZero", () => {
    const initial = {
      route: LadderDirection.ZeroToOne,
    }
    const expected = {
      route: LadderDirection.OneToZero,
    }
    const actual = flipLadderDirectionForRoute(initial, "route")
    expect(actual).toEqual(expected)
  })

  test("flips OneToZero to ZeroToOne", () => {
    const initial = {
      route: LadderDirection.OneToZero,
    }
    const expected = {
      route: LadderDirection.ZeroToOne,
    }
    const actual = flipLadderDirectionForRoute(initial, "route")
    expect(actual).toEqual(expected)
  })

  test("can flip a route that's still using the default", () => {
    const initial = {}
    const expected = {
      route: LadderDirection.OneToZero,
    }
    const actual = flipLadderDirectionForRoute(initial, "route")
    expect(actual).toEqual(expected)
  })

  test("leaves other routes unchanged", () => {
    const initial = {
      oneToZero: LadderDirection.OneToZero,
      zeroToOne: LadderDirection.ZeroToOne,
    }
    const expected = {
      oneToZero: LadderDirection.OneToZero,
      zeroToOne: LadderDirection.ZeroToOne,
      route: LadderDirection.OneToZero,
    }
    const actual = flipLadderDirectionForRoute(initial, "route")
    expect(actual).toEqual(expected)
  })
})

describe("directionOnLadder", () => {
  test("determines the vehicle direction relative the ladder direction", () => {
    expect(directionOnLadder(0, LadderDirection.ZeroToOne)).toEqual(
      VehicleDirection.Up
    )
    expect(directionOnLadder(0, LadderDirection.OneToZero)).toEqual(
      VehicleDirection.Down
    )
    expect(directionOnLadder(1, LadderDirection.ZeroToOne)).toEqual(
      VehicleDirection.Down
    )
    expect(directionOnLadder(1, LadderDirection.OneToZero)).toEqual(
      VehicleDirection.Up
    )
  })
})
