import React, { useId } from "react"
import Tippy from "@tippyjs/react"
import "tippy.js/dist/tippy.css"
import { CrowdingIcon, QuestionMarkIcon } from "../../helpers/icon"
import {
  classModifierForStatus,
  Crowding,
  statusDescriptionForStatus,
} from "../../models/crowding"

const CrowdingDiagram = ({ crowding }: { crowding: Crowding | null }) => {
  const tooltipButtonId = `riders-onboard-${useId()}`

  if (crowding === null) {
    return null
  }

  const statusDescription = statusDescriptionForStatus(crowding.occupancyStatus)

  const classModifier = classModifierForStatus(crowding.occupancyStatus)

  const loadPhrase = crowding.load === 1 ? "1 rider" : `${crowding.load} riders`

  return (
    <div className="c-crowding-diagram">
      <div className="c-crowding-diagram__properties">
        <label
          className="c-properties-list__property-label"
          htmlFor={tooltipButtonId}
        >
          Riders onboard
        </label>
        <Tippy
          content={
            <div>
              Riders are estimated using
              <br />
              Automated Passenger Counters (APCs).
            </div>
          }
          trigger="click"
          className="c-crowding-diagram__crowding-tooltip"
          onShow={() => {
            window.FS?.event('User opened "Riders Onboard" tooltip')
          }}
        >
          <button id={tooltipButtonId}>
            <QuestionMarkIcon
              role="presentation img"
              aria-label=""
              aria-hidden={true}
              className="c-crowding-diagram__tooltip-anchor"
            />
          </button>
        </Tippy>
        <br />
        {crowding.load !== null ? (
          <>
            {loadPhrase} / {crowding.capacity} seats
            <br />
            <span
              className={`c-crowding-diagram__status-description c-crowding-diagram__status-description--${classModifier}`}
            >
              {statusDescription}
            </span>
          </>
        ) : (
          "No data available"
        )}
      </div>
      <div className="c-crowding-diagram__crowding-icon-wrapper">
        <CrowdingIcon
          className={`c-crowding-diagram__crowding-icon c-crowding-diagram__crowding-icon--${classModifier}`}
        />
      </div>
    </div>
  )
}

export default CrowdingDiagram
