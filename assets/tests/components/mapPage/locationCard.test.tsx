import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import LocationCard from "../../../src/components/mapPage/locationCard"
import locationSearchResultFactory from "../../factories/locationSearchResult"

describe("LocationCard", () => {
  test("renders a location with a name", () => {
    const name = "Some Name"
    const location = locationSearchResultFactory.build({ name })

    render(<LocationCard location={location} />)

    expect(screen.getByLabelText(name)).toBeInTheDocument()
  })

  test("renders a location with no name, making address the label and giving it an additional class", () => {
    const address = "123 Fake St"
    const location = locationSearchResultFactory.build({ address, name: null })

    render(<LocationCard location={location} />)

    expect(screen.getByLabelText(address)).toBeInTheDocument()

    expect(screen.getByText(address)).toHaveClass(
      "c-location-card__title--address-only"
    )
  })

  test("onSelectLocation is invoked on click", async () => {
    const location = locationSearchResultFactory.build()
    const onSelectLocation = jest.fn()

    render(
      <LocationCard location={location} onSelectLocation={onSelectLocation} />
    )

    await userEvent.click(screen.getByText(location.name!))

    expect(onSelectLocation).toHaveBeenCalledWith(location)
  })

  test("search selection version includes street view button and additional class", () => {
    const location = locationSearchResultFactory.build()

    render(<LocationCard location={location} searchSelection={true} />)

    expect(
      screen.getByRole("link", { name: "Street View" })
    ).toBeInTheDocument()

    expect(screen.getByLabelText(location.name!)).toHaveClass(
      "c-location-card--selection"
    )
  })

  test("highlights given text in name", () => {
    const name = "Some Name"
    const location = locationSearchResultFactory.build({ name })

    render(<LocationCard location={location} highlightText="some" />)

    expect(screen.getByText("Some")).toHaveClass("highlighted")
  })

  test("highlights given text in address", () => {
    const address = "123 Test St"
    const location = locationSearchResultFactory.build({ address })

    render(<LocationCard location={location} highlightText="123" />)

    expect(screen.getByText("123")).toHaveClass("highlighted")
  })

  test("highlights given text in address when there is no location name", () => {
    const address = "123 Test St"
    const location = locationSearchResultFactory.build({
      name: null,
      address,
    })

    render(<LocationCard location={location} highlightText="123" />)

    expect(screen.getByText("123")).toHaveClass("highlighted")
  })
})
