import { describe, test, expect, jest } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import StreetViewButton from "../../src/components/streetViewButton"
import { streetViewUrl } from "../../src/util/streetViewUrl"
import userEvent from "@testing-library/user-event"
import * as FullStory from "@fullstory/browser"

jest.mock("@fullstory/browser")

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
    const mockedFS = jest.mocked(FullStory)

    render(<StreetViewButton latitude={latitude} longitude={longitude} />)

    await userEvent.click(screen.getByRole("link", { name: /Street View/i }))

    expect(mockedFS.event).toHaveBeenCalledWith("Street view link followed", {
      streetViewUrl_str: streetViewUrl({ latitude, longitude }),
      source: {
        latitude_real: latitude,
        longitude_real: longitude,
      },
    })
  })
})
