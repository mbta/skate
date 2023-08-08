import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import LocationCard from "../../../src/components/mapPage/locationCard"
import locationSearchResultFactory from "../../factories/locationSearchResult"

describe("LocationCard", () => {
  test("renders a location with a name", () => {
    const name = "Some Name"
    const location = locationSearchResultFactory.build({ name })

    render(<LocationCard location={location} />)

    expect(screen.getByLabelText(name)).toBeInTheDocument()
  })

  test("renders a location with no name, making address the label", () => {
    const address = "123 Fake St"
    const location = locationSearchResultFactory.build({ address, name: null })

    render(<LocationCard location={location} />)

    expect(screen.getByLabelText(address)).toBeInTheDocument()
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
})
