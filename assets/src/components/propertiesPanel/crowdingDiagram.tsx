import React from "react"
import Tippy from "@tippyjs/react"
import "tippy.js/dist/tippy.css"
import { CrowdingIcon, QuestionMarkIcon } from "../../helpers/icon"
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
        <Tippy
          content={
            <div>
              Riders are estimated using Automated <br /> Passenger Counters
              (APCs).
            </div>
          }
          trigger="click"
          className="m-crowding-diagram__crowding-tooltip"
        >
          <QuestionMarkIcon className="m-crowding-diagram__tooltip-anchor" />
        </Tippy>
        <br />
        {crowding.load !== null ? (
          <>
            {loadPhrase} / {crowding.capacity} seats
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
        <CrowdingIcon
          className={`m-crowding-diagram__crowding-icon m-crowding-diagram__crowding-icon--${classModifier}`}
        />
      </div>
    </div>
  )
}

export default CrowdingDiagram
