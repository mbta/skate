import React from "react"
import { ReactMarker } from "../utilities/reactMarker"
import { LocationSearchResult } from "../../../models/locationSearchResult"
import { LocationDotIcon } from "../../../helpers/icon"
import Leaflet from "leaflet"

export const LocationMarker = ({
  location,
  selected,
}: {
  location: LocationSearchResult
  selected?: boolean
}) => (
  <ReactMarker
    position={[location.latitude, location.longitude]}
    divIconSettings={{
      iconAnchor: new Leaflet.Point(9, 24),
      iconSize: [24, 18],
      className:
        "c-location-dot-icon" +
        (selected ? " c-location-dot-icon--selected" : ""),
    }}
    icon={<LocationDotIcon />}
  />
)
