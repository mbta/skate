import React from "react"
import ReactTooltip from "react-tooltip"
import { crowdingIcon, questionMarkIcon } from "../../helpers/icon"
import {
  classModifierForStatus,
  Crowding,
  statusDescriptionForStatus,
} from "../../models/crowding"

const CrowdingDiagram = ({ crowding }: { crowding: Crowding | null }) => {
  if (crowding === null) {
    return null
  }

  const statusDescription = statusDescriptionForStatus(crowding.occupancyStatus)

  const classModifier = classModifierForStatus(crowding.occupancyStatus)

  const loadPhrase = crowding.load === 1 ? "1 rider" : `${crowding.load} riders`

  return (
    <div className="m-crowding-diagram">
      <div className="m-crowding-diagram__properties">
        <span className="m-properties-list__property-label">
          Riders onboard
        </span>
        <span
          data-tip="Riders are estimated using Automated <br/> Passenger Counters (APCs)."
          data-html="true"
          data-class="m-crowding-diagram__crowding-tooltip"
        >
          {questionMarkIcon("m-crowding-diagram__tooltip-anchor")}
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
      <ReactTooltip effect="solid" event="click" globalEventOff="click" />
    </div>
  )
}

export default CrowdingDiagram
