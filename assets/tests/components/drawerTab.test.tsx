import { jest, describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import renderer from "react-test-renderer"

import DrawerTab from "../../src/components/drawerTab"

describe("drawerTab", () => {
  test("has correct icon when visible", () => {
    const tree = renderer.create(
      <DrawerTab isVisible={true} toggleVisibility={jest.fn()} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("has correct icon when collapsed", () => {
    const tree = renderer.create(
      <DrawerTab isVisible={false} toggleVisibility={jest.fn()} />
    )

    expect(tree).toMatchSnapshot()
  })

  test("calls callback when clicked", async () => {
    const mockCallback = jest.fn()
    const result = render(
      <DrawerTab isVisible={false} toggleVisibility={mockCallback} />
    )

    await userEvent.click(result.getByRole("button"))
    expect(mockCallback).toHaveBeenCalled()
  })
})
