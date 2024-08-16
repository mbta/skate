import { describe, test, expect, jest } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import { DetourListPage } from "../../src/components/detourListPage"

jest.useFakeTimers().setSystemTime(new Date('2024-08-16T13:00:00'));

describe("DetourListPage", () => {
  test("renders detour list page with dummy data", () => {
    const tree = renderer.create(<DetourListPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
