import React, { ReactElement } from "react"
import { LocationDotIcon } from "../../helpers/icon"
import { LocationSearchResult } from "../../models/locationSearchResult"
import { Card, CardBody } from "../card"
import { HighlightedMatch } from "../highlightedMatch"
import StreetViewButton from "../streetViewButton"

const LocationCard = ({
  location,
  onSelectLocation,
  searchSelection,
  highlightText,
}: {
  location: any
  onSelectLocation?: (location: LocationSearchResult) => void
  searchSelection?: boolean
  highlightText?: string
}): ReactElement => {
  return (
    <Card
      style="white"
      additionalClass={
        "c-location-card" +
        (searchSelection ? " c-location-card--selection" : "")
      }
      title={
        location.name ? (
          <HighlightedMatch
            content={location.name}
            highlightText={highlightText}
          />
        ) : (
          <span className="c-location-card__title--address-only">
            <HighlightedMatch
              content={location.address}
              highlightText={highlightText}
            />
          </span>
        )
      }
      icon={<LocationDotIcon />}
      openCallback={onSelectLocation && (() => onSelectLocation(location))}
      noFocusOrHover={searchSelection}
    >
      {((location.name && location.address) || searchSelection) && (
        <CardBody>
          {location.name && location.address && (
            <div>
              <HighlightedMatch
                content={location.address}
                highlightText={highlightText}
              />
            </div>
          )}
          {searchSelection && (
            <StreetViewButton
              latitude={location.latitude}
              longitude={location.longitude}
            />
          )}
        </CardBody>
      )}
    </Card>
  )
}

export default LocationCard
