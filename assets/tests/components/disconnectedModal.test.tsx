import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import DisconnectedModal from "../../src/components/disconnectedModal"
import { reload } from "../../src/models/browser"

jest.mock("../../src/models/browser", () => ({
  __esModule: true,
  reload: jest.fn(),
}))

describe("DisconnectedModal", () => {
  test("renders", () => {
    const tree = renderer.create(<DisconnectedModal />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("refreshes when you click the button", () => {
    const wrapper = mount(<DisconnectedModal />)
    wrapper.find("button").simulate("click")
    expect(reload).toHaveBeenCalled()
  })
})
