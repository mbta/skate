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

    const buttonElement = result.getByTitle("Close")

    expect(buttonElement.classList).toContain("m-close-button--large")
    expect(buttonElement.classList).toContain("m-close-button--green")
  })

  test("clicking button invokes callback", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <CloseButton onClick={onClick} closeButtonType="l_green" />
    )

    await user.click(result.getByTitle("Close"))

    expect(onClick).toHaveBeenCalled()
  })
})
