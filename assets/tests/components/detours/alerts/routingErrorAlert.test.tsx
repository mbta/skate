import { describe, test, expect } from "@jest/globals"
import React from "react"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { closeButton } from "../../../testHelpers/selectors/components/closeButton"
import RoutingErrorAlert from "../../../../src/components/detours/alerts/routingErrorAlert"

describe("routeErrorAlert", () => {
  test("clicking close button closes the alert", async () => {
    render(<RoutingErrorAlert />)
    const button = closeButton.get()

    expect(button).toBeVisible()

    await userEvent.click(button)

    expect(button).not.toBeInTheDocument()
  })
})
