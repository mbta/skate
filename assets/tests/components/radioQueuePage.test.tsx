import { describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import RadioQueuePage from "../../src/components/radio/radioQueuePage"

describe("RadioQueuePage", () => {
  test("renders the radio queue page heading", () => {
    render(<RadioQueuePage />)
    expect(
      screen.getByRole("heading", { name: "Radio RTT Queue" })
    ).toBeInTheDocument()
  })
})
