import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverBanner, * as blockWaiverBanner from "../../../src/components/propertiesPanel/blockWaiverBanner"
import { BlockWaiver } from "../../../src/realtime"

const {
  CurrentFuturePastType,
  currentFuturePastClass,
  currentFuturePastTitle,
  currentFuturePastType,
  formatEpochSeconds,
  hours12,
  nowEpochSeconds,
} = blockWaiverBanner

describe("BlockWaiverBanner", () => {
  jest
    .spyOn(blockWaiverBanner, "nowEpochSeconds")
    .mockImplementation(() => 1582647451)

  test("renders", () => {
    const blockWaiver: BlockWaiver = {
      startTime: 1582646000,
      endTime: 1582647000,
      remark: "E:1106",
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("formatEpochSeconds", () => {
  test("formats an epoch time in seconds nicely", () => {
    expect(formatEpochSeconds(1582646000)).toEqual("10:53am")
    expect(formatEpochSeconds(1582659000)).toEqual("2:30pm")
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

describe("nowEpochSeconds", () => {
  test("returns an epoch time in seconds (defaulting to now)", () => {
    expect(nowEpochSeconds(1582647451124)).toEqual(1582647451)
  })
})

describe("currentFuturePastType", () => {
  const blockWaiver = {
    startTime: 2,
    endTime: 4,
    remark: "test",
  }

  test("returns the Current type for a block waiver that is currently active", () => {
    jest.spyOn(blockWaiverBanner, "nowEpochSeconds").mockImplementation(() => 3)

    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Current
    )
  })

  test("returns Future type for a block waiver that hasn't yet started", () => {
    jest.spyOn(blockWaiverBanner, "nowEpochSeconds").mockImplementation(() => 1)

    expect(currentFuturePastType(blockWaiver)).toEqual(
      CurrentFuturePastType.Future
    )
  })

  test("returns Past type for a block waiver that has ended", () => {
    jest.spyOn(blockWaiverBanner, "nowEpochSeconds").mockImplementation(() => 5)

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
      .spyOn(blockWaiverBanner, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Current)

    expect(currentFuturePastClass(blockWaiver)).toEqual("current")
  })

  test("returns 'future' for a block waiver that hasn't yet started", () => {
    jest
      .spyOn(blockWaiverBanner, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Future)

    expect(currentFuturePastClass(blockWaiver)).toEqual("future")
  })

  test("returns 'past' for a block waiver that has ended", () => {
    jest
      .spyOn(blockWaiverBanner, "currentFuturePastType")
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
      .spyOn(blockWaiverBanner, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Current)

    expect(currentFuturePastTitle(blockWaiver)).toEqual("Current")
  })

  test("returns 'Future Notice' for a block waiver that hasn't yet started", () => {
    jest
      .spyOn(blockWaiverBanner, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Future)

    expect(currentFuturePastTitle(blockWaiver)).toEqual("Future Notice")
  })

  test("returns 'Past Notice' for a block waiver that has ended", () => {
    jest
      .spyOn(blockWaiverBanner, "currentFuturePastType")
      .mockImplementation(() => CurrentFuturePastType.Past)

    expect(currentFuturePastTitle(blockWaiver)).toEqual("Past Notice")
  })
})
