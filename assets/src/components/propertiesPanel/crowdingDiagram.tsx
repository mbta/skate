import React from "react"
import { crowdingIcon } from "../../helpers/icon"
import { Crowding } from "../../realtime"

const extendedOccupancyStatus = (crowding: Crowding): string => {
  // GTFS-RT has an EMPTY occupancy status but we don't use it; an empty
  // crowding will have a MANY_SEATS_AVAILABLE status. Additionally, it's
  // possible that the route this crowding is on generally has crowding data,
  // but it's not working at the moment for this crowding in particular.

  if (crowding.load === null) {
    return "NO_DATA"
  }

  if (crowding.load === 0) {
    return "EMPTY"
  }

  // If crowding.load isn't null, crowding.occupancyStatus shouldn't be either.
  return crowding.occupancyStatus!
}

const statusDescriptionForStatus = (status: string): string => {
  switch (status) {
    case "NO_DATA":
      return "No data available"
    case "EMPTY":
      return "Empty"
    case "MANY_SEATS_AVAILABLE":
      return "Not crowded"
    case "FEW_SEATS_AVAILABLE":
      return "Some crowding"
    case "FULL":
      return "Crowded"
  }

  // We should never get here.
  return ""
}

const classModifierForStatus = (status: string): string => {
  switch (status) {
    case "NO_DATA":
      return "no-data"
    case "EMPTY":
      return "empty"
    case "MANY_SEATS_AVAILABLE":
      return "not-crowded"
    case "FEW_SEATS_AVAILABLE":
      return "some-crowding"
    case "FULL":
      return "crowded"
  }

  // We should never get here.
  return ""
}

const CrowdingDiagram = ({ crowding }: { crowding: Crowding | null }) => {
  if (crowding === null) {
    return null
  }

  const statusDescription = statusDescriptionForStatus(
    extendedOccupancyStatus(crowding)
  )

  const classModifier = classModifierForStatus(
    extendedOccupancyStatus(crowding)
  )

  return (
    <div className="m-crowding-diagram">
      <div className="m-crowding-diagram__properties">
        <span className="m-properties-list__property-label">
          Riders onboard
        </span>
        <br />
        {statusDescription !== "NO_DATA" ? (
          <>
            {crowding.load} riders / {crowding.capacity} maximum
            <br />
            <span
              className={`m-crowding-diagram__status-description m-crowding-diagram__status-description--${classModifier}`}
            >
              {statusDescription}
            </span>
          </>
        ) : (
          "No data available"
        )}
      </div>
      <div className="m-crowding-diagram__crowding-icon-wrapper">
        {crowdingIcon(
          `m-crowding-diagram__crowding-icon m-crowding-diagram__crowding-icon--${classModifier}`
        )}
      </div>
    </div>
  )
}

export default CrowdingDiagram
