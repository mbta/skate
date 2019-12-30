import {
  directionOnLadder,
  LadderDirection,
  VehicleDirection,
} from "../../src/models/ladderDirection"

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
