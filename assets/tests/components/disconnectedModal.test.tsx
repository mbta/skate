import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import DisconnectedModal from "../../src/components/disconnectedModal"

// tslint:disable no-empty

describe("DisconnectedModal", () => {
  test("renders", () => {
    const tree = renderer.create(<DisconnectedModal />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("refreshes when you click the button", () => {
    const wrapper = mount(<DisconnectedModal />)
    window.location.reload = jest.fn()
    wrapper.find("button").simulate("click")
    expect(window.location.reload).toHaveBeenCalled()
  })
})
