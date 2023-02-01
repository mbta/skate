import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import StreetViewButton from "../../src/components/streetViewButton"
import { streetViewUrl } from "../../src/util/streetViewUrl"
import userEvent from "@testing-library/user-event"

const latitude = 42.3601
const longitude = 71.0589
describe("StreetViewButton", () => {
  test("link element with expected title and href", () => {
    render(<StreetViewButton latitude={latitude} longitude={longitude} />)

    expect(screen.getByRole("link", { name: /Street View/i })).toHaveAttribute(
      "href",
      streetViewUrl({ latitude, longitude })
    )
  })

  test("clicking the link triggers a FullStory event", async () => {
    const originalFS = window.FS
    window.FS = { event: jest.fn(), identify: jest.fn() }
    afterEach(() => {
      window.FS = originalFS
    })

    render(<StreetViewButton latitude={latitude} longitude={longitude} />)

    await userEvent.click(screen.getByRole("link", { name: /Street View/i }))

    expect(window.FS.event).toHaveBeenCalledWith("Street view link followed")
  })
})
