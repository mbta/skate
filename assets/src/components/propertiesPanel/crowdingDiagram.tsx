import React from "react"
import ReactTooltip from "react-tooltip"
import { crowdingIcon } from "../../helpers/icon"
import { Crowding, OccupancyStatus } from "../../realtime"

const statusDescriptionForStatus = (status: OccupancyStatus): string => {
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
}

const classModifierForStatus = (status: OccupancyStatus): string => {
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
}

const CrowdingDiagram = ({ crowding }: { crowding: Crowding | null }) => {
  if (crowding === null) {
    return null
  }

  const statusDescription = statusDescriptionForStatus(crowding.occupancyStatus)

  const classModifier = classModifierForStatus(crowding.occupancyStatus)

  const loadPhrase = crowding.load === 1 ? "1 rider" : `${crowding.load} riders`

  return (
    <div
      className="m-crowding-diagram"
      data-tip="This data is an estimate based on the onboard APC units."
    >
      <div className="m-crowding-diagram__properties">
        <span className="m-properties-list__property-label">
          Riders onboard
        </span>
        <br />
        {crowding.load !== null ? (
          <>
            {loadPhrase} / {crowding.capacity} maximum
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
      <ReactTooltip effect="solid" globalEventOff="click" />
    </div>
  )
}

export default CrowdingDiagram
