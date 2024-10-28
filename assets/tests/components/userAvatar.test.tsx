import { describe, expect, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { UserAvatar } from "../../src/components/userAvatar"

describe("UserAvatar", () => {
  test("Displays first letter of user identifier", () => {
    const userName = "fake@test.com"

    render(<UserAvatar userName={userName} />)

    expect(screen.getByText("F")).toBeInTheDocument()
  })
})
