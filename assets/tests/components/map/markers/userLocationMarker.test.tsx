import React from "react"
import { describe, expect, test } from "@jest/globals"
import { render } from "@testing-library/react"
import { MapContainer } from "react-leaflet"
import UserLocationMarker from "../../../../src/components/map/markers/userLocationMarker"
import geolocationCoordinates from "../../../factories/geolocationCoordinates"
import { setHtmlWidthHeightForLeafletMap } from "../../../testHelpers/leafletMapWidth"
import { LatLngExpression } from "leaflet"

describe("UserLocationMarker", () => {
  test("renders both circles, with the accuracy circle having the correct radius", () => {
    setHtmlWidthHeightForLeafletMap()

    const location = geolocationCoordinates.build({ accuracy: 100 })

    const { container } = renderInMap(
      <UserLocationMarker location={location} />,
      [location.latitude, location.longitude]
    )

    const svgComponent = container.querySelector("svg")

    expect(
      svgComponent
        ?.querySelector("circle.c-user-location-marker__center-dot")
        ?.getAttribute("r")
    ).toBe("10")

    const accuracyRadius = parseFloat(
      svgComponent
        ?.querySelector("circle.c-user-location-marker__accuracy-radius")
        ?.getAttribute("r") || ""
    )

    // comparing to the result observed in the browser at the same zoom level and approximate location
    // This size was also compared against map features to make sure it was roughly correct
    expect(accuracyRadius).toBeCloseTo(56.7, 1)
  })
})

const renderInMap = (component: JSX.Element, center: LatLngExpression) =>
  render(
    <MapContainer
      center={center}
      zoom={16}
      zoomControl={true}
      maxBounds={[
        [41.2, -72],
        [43, -69.8],
      ]}
    >
      {component}
    </MapContainer>
  )
