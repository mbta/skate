import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CloseButton from "../../src/components/closeButton"

describe("CloseButton", () => {
  test("renders button with appropriate class", () => {
    const onClick = jest.fn()
    const result = render(
      <CloseButton onClick={onClick} closeButtonType="l_green" />
    )

    const buttonElement = result.getByRole("button", { name: /close/i })

    expect(buttonElement.classList).toContain("c-close-button--large")
    expect(buttonElement.classList).toContain("c-close-button--green")
  })

  test("clicking button invokes callback", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <CloseButton onClick={onClick} closeButtonType="l_green" />
    )

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(onClick).toHaveBeenCalled()
  })
})
