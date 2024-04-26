import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import DataStatusBanner from "../../src/components/dataStatusBanner"
import useDataStatus from "../../src/hooks/useDataStatus"

jest.mock("../../src/hooks/useDataStatus", () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe("DataStatusBanner", () => {
  test("doesn't show anything when status is good", () => {
    jest.mocked(useDataStatus).mockImplementationOnce(() => "good")
    const tree = renderer.create(<DataStatusBanner />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("shows outage banner when there's an outage", () => {
    jest.mocked(useDataStatus).mockImplementationOnce(() => "outage")
    const tree = renderer.create(<DataStatusBanner />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
