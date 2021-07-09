import React from "react"
import renderer from "react-test-renderer"
import { mount } from "enzyme"

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

  test("calls callback when clicked", () => {
    const mockCallback = jest.fn()
    const wrapper = mount(
      <DrawerTab isVisible={false} toggleVisibility={mockCallback} />
    )
    wrapper.find(".c-drawer-tab__tab-button").simulate("click")

    expect(mockCallback).toHaveBeenCalled()
  })
})
