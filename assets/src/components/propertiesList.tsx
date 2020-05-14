import React from "react"
import { intersperseString } from "../helpers/array"
import { filterToAlphanumeric } from "../models/searchQuery"
import { formattedRunNumber } from "../models/shuttle"
import { isVehicle } from "../models/vehicle"
import { Ghost, Vehicle, VehicleOrGhost } from "../realtime"
import { formattedTime, formattedTimeDiff, now } from "../util/dateTime"

interface Props {
  vehicleOrGhost: VehicleOrGhost
  highlightText?: string
}

export interface Property {
  label: string
  value: string
  classNameModifier?: string
}

export const formattedLogonTime = (logonDate: Date): string => {
  const nowDate: Date = now()

  return `${formattedTimeDiff(nowDate, logonDate)}; ${formattedTime(logonDate)}`
}

const vehicleProperties = (vehicle: Vehicle): Property[] => {
  const { runId, label, operatorId, operatorName, operatorLogonTime } = vehicle

  return [
    {
      label: "Run",
      value: vehicle.isShuttle
        ? formattedRunNumber(vehicle)
        : vehicle.isOverload && !!vehicle.runId
        ? `ADDED ${runId}`
        : runId || "Not Available",
    },
    {
      label: "Vehicle",
      value: label,
    },
    {
      label: "Operator",
      value: `${operatorName} #${operatorId}`,
    },
    {
      label: "Last Login",
      value: operatorLogonTime
        ? formattedLogonTime(operatorLogonTime)
        : "Not Available",
      classNameModifier: "last-login",
    },
  ]
}

const ghostProperties = (ghost: Ghost): Property[] => [
  {
    label: "Run",
    value: ghost.runId || "Not Available",
  },
]

const properties = (vehicleOrGhost: VehicleOrGhost): Property[] =>
  isVehicle(vehicleOrGhost)
    ? vehicleProperties(vehicleOrGhost)
    : ghostProperties(vehicleOrGhost)

export const Highlighted = ({
  content,
  highlightText,
}: {
  content: string
  highlightText?: string
}): JSX.Element => {
  if (highlightText === undefined) {
    return <>{content}</>
  }

  const match = content.match(highlightRegex(highlightText))

  if (match === null || match.index === undefined) {
    return <>{content}</>
  }

  const matchingString = match[0]

  return (
    <>
      {[
        content.slice(0, match.index),
        <span className="highlighted" key={`highlighted-${match.index}`}>
          {matchingString}
        </span>,
        <Highlighted
          content={content.slice(match.index + match[0].length)}
          highlightText={highlightText}
          key={`highlighted-extension-${match.index + match[0].length}`}
        />,
      ]}
    </>
  )
}

const highlightRegex = (highlightText: string): RegExp => {
  const stripped = filterToAlphanumeric(highlightText)
  const allowNonAlphanumeric = intersperseString(stripped, "[^0-9a-zA-Z]*")
  return new RegExp(allowNonAlphanumeric, "i")
}

const modifiedClassName = (classNameModifier?: string): string =>
  classNameModifier ? `m-properties-list__property--${classNameModifier}` : ""

const PropertyRow = ({
  property: { label, value, classNameModifier },
  highlightText,
}: {
  property: Property
  highlightText?: string
}) => (
  <tr
    className={`m-properties-list__property ${modifiedClassName(
      classNameModifier
    )}`}
  >
    <td className="m-properties-list__property-label">{label}</td>
    <td className="m-properties-list__property-value">
      <Highlighted content={value} highlightText={highlightText} />
    </td>
  </tr>
)

const PropertiesList = ({ vehicleOrGhost, highlightText }: Props) => (
  <div className="m-properties-list">
    <table className="m-properties-list__table">
      <tbody>
        {properties(vehicleOrGhost).map((property) => (
          <PropertyRow
            property={property}
            highlightText={highlightText}
            key={`${property.label}`}
          />
        ))}
      </tbody>
    </table>
  </div>
)

export default PropertiesList
