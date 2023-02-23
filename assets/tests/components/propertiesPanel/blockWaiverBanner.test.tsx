import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import renderer from "react-test-renderer"
import BlockWaiverBanner, {
  NoWaiverBanner,
} from "../../../src/components/propertiesPanel/blockWaiverBanner"
import { BlockWaiver } from "../../../src/realtime"
import * as dateTime from "../../../src/util/dateTime"

describe("BlockWaiverBanner", () => {
  jest
    .spyOn(dateTime, "now")
    .mockImplementation(() => new Date("2020-02-25T16:10:00.000Z"))

  test("renders a current time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:53:20.000Z"),
      endTime: new Date("2020-02-25T16:26:40.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a future time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T16:26:40.000Z"),
      endTime: new Date("2020-02-25T16:43:20.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a past time waiver", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:36:40.000Z"),
      endTime: new Date("2020-02-25T15:53:20.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const tree = renderer
      .create(<BlockWaiverBanner blockWaiver={blockWaiver} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("includes cause description and remark", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:36:40.000Z"),
      endTime: new Date("2020-02-25T15:53:20.000Z"),
      causeId: 26,
      causeDescription: "E - Diverted",
      remark: "1106",
    }
    const result = render(<BlockWaiverBanner blockWaiver={blockWaiver} />)

    expect(result.queryByText("E - Diverted 1106")).toBeVisible()
  })

  test("includes just the cause description if remark is null", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:36:40.000Z"),
      endTime: new Date("2020-02-25T15:53:20.000Z"),
      causeId: 25,
      causeDescription: "D - Disabled Bus",
      remark: null,
    }
    const result = render(<BlockWaiverBanner blockWaiver={blockWaiver} />)

    expect(result.queryByText("D - Disabled Bus")).toBeVisible()
  })

  test("deduplicates the description if it's included in the remark", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("2020-02-25T15:36:40.000Z"),
      endTime: new Date("2020-02-25T15:53:20.000Z"),
      causeId: 25,
      causeDescription: "D - Disabled Bus",
      remark: "D - Disabled Bus:",
    }
    const result = render(<BlockWaiverBanner blockWaiver={blockWaiver} />)

    expect(result.queryAllByText(/D - Disabled Bus/)).toHaveLength(1)
  })
})

describe("NoWaiverBanner", () => {
  test("renders unknown ghost bus", () => {
    render(<NoWaiverBanner />)
    expect(
      screen.getByRole("heading", { name: "Unknown Ghost Bus" })
    ).toBeVisible()
  })
})
