import React from "react"
import { intersperseString } from "../helpers/array"
import { filterToAlphanumeric } from "../models/searchQuery"
import { formattedRunNumber } from "../models/shuttle"
import { isVehicle } from "../models/vehicle"
import { Ghost, Vehicle, VehicleOrGhost } from "../realtime"
import { formattedTime, formattedTimeDiff, now } from "../util/dateTime"

interface Props {
  properties: Property[]
  highlightText?: string
}

export interface Property {
  label: string
  value: string | null
  classNameModifier?: string
  sensitive?: boolean
}

export const formattedLogonTime = (logonDate: Date): string => {
  const nowDate: Date = now()

  return `${formattedTimeDiff(nowDate, logonDate)}; ${formattedTime(logonDate)}`
}

export const vehicleProperties = (vehicle: Vehicle): Property[] => {
  const {
    runId,
    label,
    operatorId,
    operatorFirstName,
    operatorLastName,
    operatorLogonTime,
  } = vehicle

  const operatorValue =
    [operatorFirstName, operatorLastName, operatorId ? `#${operatorId}` : null]
      .filter((e) => e !== null)
      .join(" ") || "Not Available"

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
      value: operatorValue,
      classNameModifier: "operator",
      sensitive: true,
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

export const ghostProperties = (ghost: Ghost): Property[] => [
  {
    label: "Run",
    value: ghost.runId || "Not Available",
  },
]

export const vehicleOrGhostProperties = (
  vehicleOrGhost: VehicleOrGhost
): Property[] =>
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
  property: { label, value, classNameModifier, sensitive },
  highlightText,
}: {
  property: Property
  highlightText?: string
}) =>
  value === null ? null : (
    <tr
      className={`m-properties-list__property ${modifiedClassName(
        classNameModifier
      )}${sensitive ? " fs-mask" : ""}`}
    >
      <td className="m-properties-list__property-label">{label}</td>
      <td className="m-properties-list__property-value">
        <Highlighted content={value} highlightText={highlightText} />
      </td>
    </tr>
  )

const PropertiesList = ({ properties, highlightText }: Props) => (
  <div className="m-properties-list">
    <table className="m-properties-list__table">
      <tbody>
        {properties.map((property) => (
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
