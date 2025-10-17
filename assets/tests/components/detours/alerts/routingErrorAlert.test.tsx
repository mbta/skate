import { describe, test, expect } from "@jest/globals"
import React from "react"
import "@testing-library/jest-dom/jest-globals"
import { render, waitForElementToBeRemoved } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { closeButton } from "../../../testHelpers/selectors/components/closeButton"
import RoutingErrorAlert from "../../../../src/components/detours/alerts/routingErrorAlert"

describe("routeErrorAlert", () => {
  test("clicking close button closes the alert", async () => {
    render(<RoutingErrorAlert />)

    expect(closeButton.get()).toBeVisible()

    await userEvent.click(closeButton.get())

    await waitForElementToBeRemoved(() => closeButton.get())
  })
})
