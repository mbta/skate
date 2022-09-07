import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

  test("refreshes when you click the button", async () => {
    const result = render(<DisconnectedModal />)
    await userEvent.click(result.getByRole("button"))
    expect(reload).toHaveBeenCalled()
  })
})
