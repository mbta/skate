import { describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import { DetourListPage } from "../../src/components/detourListPage"

describe("DetourListPage", () => {
  test("renders detour list page with dummy data", () => {
    const tree = renderer.create(<DetourListPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
