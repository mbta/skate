import React from "react"
import {
  Battery0to20Icon,
  Battery21to40Icon,
  Battery41to60Icon,
  Battery61to80Icon,
  Battery81to100Icon,
  BatteryUnknownIcon,
} from "../../helpers/icon"
import { StateOfCharge, StateOfChargeMissing } from "../../models/stateOfCharge"
import useCurrentTime from "../../hooks/useCurrentTime"
import { timeAgoLabelFromDate } from "../../util/dateTime"

const getIcon = (stateOfCharge: StateOfCharge | StateOfChargeMissing) => {
  if (stateOfCharge === null) {
    return BatteryUnknownIcon
  } else if (stateOfCharge.value === null) {
    return BatteryUnknownIcon
  } else if (stateOfCharge.value > 80) {
    return Battery81to100Icon
  } else if (stateOfCharge.value > 60) {
    return Battery61to80Icon
  } else if (stateOfCharge.value > 40) {
    return Battery41to60Icon
  } else if (stateOfCharge.value > 20) {
    return Battery21to40Icon
  } else if (stateOfCharge.value > 0) {
    return Battery0to20Icon
  } else {
    return BatteryUnknownIcon
  }
}

const getLastUpdated = (
  stateOfCharge: StateOfCharge | StateOfChargeMissing,
  epochNow: Date
) => {
  if (stateOfCharge.time) {
    return timeAgoLabelFromDate(stateOfCharge.time, epochNow)
  } else {
    return ""
  }
}

const StateOfChargeInfo = ({
  stateOfCharge,
}: {
  stateOfCharge: StateOfCharge | StateOfChargeMissing
}) => {
  const epochNow = useCurrentTime()
  const lastUpdated = getLastUpdated(stateOfCharge, epochNow)
  const BatteryIcon = getIcon(stateOfCharge)

  return (
    <div className="c-state-of-charge-info">
      <div className="c-state-of-charge-info__properties">
        <span className="c-properties-list__property-label">Battery</span>
        <span className="c-properties-list__property-label c-state-of-charge-info__time-ago">
          {lastUpdated}
        </span>
        <br />
        {stateOfCharge.value !== null ? (
          <>
            <span>{stateOfCharge.value}% left</span>
            <br />
            <span>{stateOfCharge.milesRemaining} miles remaining estimate</span>
          </>
        ) : (
          <>
            <span>Unknown</span>
            <br />
            <span>Unknown miles remaining</span>
          </>
        )}
      </div>
      <div className="c-state-of-charge-info__battery-icon-wrapper">
        <BatteryIcon className={`c-state-of-charge-info__battery-icon`} />
      </div>
    </div>
  )
}

export default StateOfChargeInfo
