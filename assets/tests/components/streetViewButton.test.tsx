import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import StreetViewButton from "../../src/components/streetViewButton"
import { streetViewUrl } from "../../src/util/streetViewUrl"

const latitude = 42.3601
const longitude = 71.0589
describe("StreetViewButton", () => {
  test("link element with expected title and href", () => {
    render(
      <StreetViewButton latitude={latitude} longitude={longitude} />
    )

    expect(screen.getByRole("link", { name: /Street View/i })).toHaveAttribute(
      "href",
      streetViewUrl({ latitude, longitude })
    )
  })

    expect(link).toHaveAttribute("href", streetViewUrl({ latitude, longitude }))
  })
})
