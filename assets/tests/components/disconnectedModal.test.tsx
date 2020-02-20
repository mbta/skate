import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import DisconnectedModal from "../../src/components/disconnectedModal"
import * as browser from "../../src/models/browser"

// tslint:disable no-empty

describe("DisconnectedModal", () => {
  test("renders", () => {
    const tree = renderer.create(<DisconnectedModal />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("refreshes when you click the button", () => {
    const wrapper = mount(<DisconnectedModal />)
    jest.spyOn(browser, "reload").mockImplementation(() => {})
    wrapper.find("button").simulate("click")
    expect(browser.reload).toHaveBeenCalled()
  })
})
