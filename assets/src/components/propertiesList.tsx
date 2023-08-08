import React from "react"
import { formattedRunNumber } from "../models/shuttle"
import { isLoggedOut, isVehicle } from "../models/vehicle"
import { Ghost, Vehicle } from "../realtime"
import { formattedTime, formattedTimeDiff, now } from "../util/dateTime"
import { HighlightedMatch } from "./highlightedMatch"

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

export const vehicleProperties = (
  vehicle: Vehicle,
  operatorLastNameOnly?: boolean
): Property[] => {
  const {
    runId,
    label,
    operatorId,
    operatorFirstName,
    operatorLastName,
    operatorLogonTime,
  } = vehicle

  const isLoggedOutVehicle = isVehicle(vehicle) && isLoggedOut(vehicle)

  const operatorValue =
    [
      operatorLastNameOnly ? null : operatorFirstName,
      operatorLastName,
      operatorId ? `#${operatorId}` : null,
    ]
      .filter((e) => e !== null)
      .join(" ") || "Not Available"

  return [
    ...(isLoggedOutVehicle
      ? []
      : [
          {
            label: "Run",
            value: vehicle.isShuttle
              ? formattedRunNumber(vehicle)
              : vehicle.isOverload && !!vehicle.runId
              ? `ADDED ${runId}`
              : runId || "Not Available",
          },
        ]),
    {
      label: "Vehicle",
      value: label,
    },
    ...(isLoggedOutVehicle
      ? []
      : [
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
        ]),
  ]
}

export const ghostProperties = (ghost: Ghost): Property[] => [
  {
    label: "Run",
    value: ghost.runId || "Not Available",
  },
]

export const vehicleOrGhostProperties = (
  vehicleOrGhost: Vehicle | Ghost,
  operatorLastNameOnly?: boolean
): Property[] =>
  isVehicle(vehicleOrGhost)
    ? vehicleProperties(vehicleOrGhost, operatorLastNameOnly)
    : ghostProperties(vehicleOrGhost)

const modifiedClassName = (classNameModifier?: string): string =>
  classNameModifier ? `c-properties-list__property--${classNameModifier}` : ""

const PropertyRow = ({
  property: { label, value, classNameModifier, sensitive },
  highlightText,
}: {
  property: Property
  highlightText?: string
}) =>
  value === null ? null : (
    <tr
      className={`c-properties-list__property ${modifiedClassName(
        classNameModifier
      )}${sensitive ? " fs-mask" : ""}`}
    >
      <td className="c-properties-list__property-label">{label}</td>
      <td className="c-properties-list__property-value">
        <HighlightedMatch content={value} highlightText={highlightText} />
      </td>
    </tr>
  )

const PropertiesList = ({ properties, highlightText }: Props) => (
  <div className="c-properties-list">
    <table className="c-properties-list__table">
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
