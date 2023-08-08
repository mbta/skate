import React, { ReactElement } from "react"
import { LocationDotIcon } from "../../helpers/icon"
import { LocationSearchResult } from "../../models/locationSearchResult"
import { Card, CardBody } from "../card"
import StreetViewButton from "../streetViewButton"

const LocationCard = ({
  location,
  onSelectLocation,
  searchSelection,
}: {
  location: any
  onSelectLocation?: (location: LocationSearchResult) => void
  searchSelection?: boolean
}): ReactElement => {
  return (
    <Card
      style="white"
      additionalClass={
        "c-location-card" +
        (searchSelection ? " c-location-card--selection" : "")
      }
      title={
        location.name || (
          <span className="c-location-card__title--address-only">
            {location.address}
          </span>
        )
      }
      icon={<LocationDotIcon />}
      openCallback={onSelectLocation && (() => onSelectLocation(location))}
    >
      {((location.name && location.address) || searchSelection) && (
        <CardBody>
          {location.name && location.address && <div>{location.address}</div>}
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
