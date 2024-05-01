import { jest, describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React, { ReactNode, ReactPortal } from "react"
import renderer from "react-test-renderer"
import DisconnectedModal from "../../src/components/disconnectedModal"
import { reload } from "../../src/models/browser"
import ReactDOM from "react-dom"

jest.mock("../../src/models/browser", () => ({
  __esModule: true,
  reload: jest.fn(),
}))

jest.mock("react-dom", () => {
  return {
    ...(jest.requireActual("react-dom") as typeof ReactDOM),
    createPortal: (node: ReactNode): ReactPortal => node as ReactPortal,
  }
})

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
