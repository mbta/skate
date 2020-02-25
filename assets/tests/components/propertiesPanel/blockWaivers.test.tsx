import React from "react"
import renderer from "react-test-renderer"
import BlockWaivers, * as blockWaivers from "../../../src/components/propertiesPanel/blockWaivers"
import { BlockWaiver } from "../../../src/realtime"

const {
  CurrentFuturePastType,
  currentFuturePastClass,
  currentFuturePastTitle,
  currentFuturePastType,
  formatTimeOfDay,
  hours12,
  nowTimeOfDay,
} = blockWaivers

describe("BlockWaivers", () => {
  test("renders", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 18300,
      endTime: 45480,
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaivers blockWaivers={[blockWaiver]} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("formatTimeOfDay", () => {
  test("formats a time of day (seconds after midnight) nicely", () => {
    expect(formatTimeOfDay(18300)).toEqual("5:05am")
    expect(formatTimeOfDay(45480)).toEqual("12:38pm")
    expect(formatTimeOfDay(81720)).toEqual("10:42pm")
  })
})

describe("hours12", () => {
  test("returns the 12-hour version of the 24-hour-plus hour", () => {
    expect(hours12(0)).toEqual(0)
    expect(hours12(5)).toEqual(5)
    expect(hours12(12)).toEqual(12)
    expect(hours12(13)).toEqual(1)
    expect(hours12(24)).toEqual(12)
    expect(hours12(25)).toEqual(1)
  })
})

describe("nowTimeOfDay", () => {
  test("returns a 'time of day' for the given time (defaulting to now)", () => {
    expect(nowTimeOfDay(new Date("Februrary 18, 2020 5:05"))).toEqual(18300)
    expect(nowTimeOfDay(new Date("Februrary 18, 2020 12:38"))).toEqual(45480)
    expect(nowTimeOfDay(new Date("Februrary 18, 2020 22:42"))).toEqual(81720)
  })
})

describe("currentFuturePastType", () => {
  const blockWaiver = {
    startTime: 2,
    endTime: 4,
    remark: "test",
  }

  test("returns the Current type for a block waiver that is currently active", () => {
    jest.spyOn(blockWaivers, "nowTimeOfDay").mockImplementation(() => 3)

    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Current
    )
  })

  test("returns Future type for a block waiver that hasn't yet started", () => {
    jest.spyOn(blockWaivers, "nowTimeOfDay").mockImplementation(() => 1)

    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Future
    )
  })

  test("returns Past type for a block waiver that has ended", () => {
    jest.spyOn(blockWaivers, "nowTimeOfDay").mockImplementation(() => 5)

    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Past
    )
  })
})

describe("currentFuturePastClass", () => {
  const blockWaiver: BlockWaiver = {
    startTime: 18300,
    endTime: 45480,
    remark: "E:1106",
  }

  test("returns 'current' for a block waiver that is currently active", () => {
    jest
      .spyOn(blockWaivers, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Current)

    expect(currentFuturePastClass(blockWaiver)).toEqual("current")
  })

  test("returns 'future' for a block waiver that hasn't yet started", () => {
    jest
      .spyOn(blockWaivers, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Future)

    expect(currentFuturePastClass(blockWaiver)).toEqual("future")
  })

  test("returns 'past' for a block waiver that has ended", () => {
    jest
      .spyOn(blockWaivers, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Past)

    expect(currentFuturePastClass(blockWaiver)).toEqual("past")
  })
})

describe("currentFuturePastTitle", () => {
  const blockWaiver: BlockWaiver = {
    startTime: 18300,
    endTime: 45480,
    remark: "E:1106",
  }

  test("returns 'Current' for a block waiver that is currently active", () => {
    jest
      .spyOn(blockWaivers, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Current)

    expect(currentFuturePastTitle(blockWaiver)).toEqual("Current")
  })

  test("returns 'Future Notice' for a block waiver that hasn't yet started", () => {
    jest
      .spyOn(blockWaivers, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Future)

    expect(currentFuturePastTitle(blockWaiver)).toEqual("Future Notice")
  })

  test("returns 'Past Notice' for a block waiver that has ended", () => {
    jest
      .spyOn(blockWaivers, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Past)

    expect(currentFuturePastTitle(blockWaiver)).toEqual("Past Notice")
  })
})
