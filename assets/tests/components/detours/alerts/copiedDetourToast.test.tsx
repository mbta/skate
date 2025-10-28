import { describe, test, expect } from "@jest/globals"
import React from "react"
import "@testing-library/jest-dom/jest-globals"
import { render, waitForElementToBeRemoved } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { closeButton } from "../../../testHelpers/selectors/components/closeButton"
import CopiedDetourToast from "../../../../src/components/detours/alerts/copiedDetourToast"

describe("copiedDetourToast", () => {
  test("clicking close button closes the alert", async () => {
    render(<CopiedDetourToast />)

    expect(closeButton.get()).toBeVisible()

    await userEvent.click(closeButton.get())

    // Short timeout, wait for animation but don't wait for the default timeout / auto-close
    await waitForElementToBeRemoved(() => closeButton.get(), { timeout: 5 })
  })

  test("the alert auto-closes after timeout milliseconds if the alert is not dismissed", async () => {
    render(<CopiedDetourToast timeout={10} />)

    expect(closeButton.get()).toBeVisible()

    // Wait slightly longer than the 10 ms auto-close
    await waitForElementToBeRemoved(() => closeButton.get(), { timeout: 50 })
  })
})
