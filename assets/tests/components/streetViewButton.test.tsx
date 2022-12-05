import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import StreetViewButton from "../../src/components/streetViewButton"
import { streetViewUrl } from "../../src/util/streetViewUrl"

const latitude = 42.3601
const longitude = 71.0589
describe("StreetViewButton", () => {
  test("link element with expected title and href", () => {
    const result = render(
      <StreetViewButton latitude={latitude} longitude={longitude} />
    )

    const link = result.getByRole("link", { name: "Go to Street View" })

    expect(link).toHaveAttribute("href", streetViewUrl({ latitude, longitude }))
  })
})
