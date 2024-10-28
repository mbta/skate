import { jest, describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import DisconnectedModal from "../../src/components/disconnectedModal"
import { reload } from "../../src/models/browser"

jest.mock("../../src/models/browser", () => ({
  __esModule: true,
  reload: jest.fn(),
}))

describe("DisconnectedModal", () => {
  test("renders", () => {
    const { baseElement } = render(<DisconnectedModal />)
    expect(baseElement).toMatchSnapshot()
  })

  test("refreshes when you click the button", async () => {
    const result = render(<DisconnectedModal />)
    await userEvent.click(result.getByRole("button"))
    expect(reload).toHaveBeenCalled()
  })
})
