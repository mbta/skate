import React from "react"
import { formattedRunNumber } from "../models/shuttle"
import { isAVehicle, isShuttle } from "../models/vehicle"
import { Ghost, Vehicle, VehicleOrGhost } from "../realtime"

interface Props {
  vehicleOrGhost: VehicleOrGhost
  highlightText?: string
}

export interface Property {
  label: string
  value: string
}

const vehicleProperties = (vehicle: Vehicle): Property[] => {
  const { runId, label, operatorId, operatorName } = vehicle

  return [
    {
      label: "Run",
      value: isShuttle(vehicle)
        ? formattedRunNumber(vehicle)
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
  ]
}

const ghostProperties = (ghost: Ghost): Property[] => [
  {
    label: "Run",
    value: ghost.runId || "Not Available",
  },
]

const properties = (vehicleOrGhost: VehicleOrGhost): Property[] =>
  isAVehicle(vehicleOrGhost)
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

  const regex = new RegExp(highlightText, "i")
  const match = content.match(regex)

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

const PropertyRow = ({
  property: { label, value },
  highlightText,
}: {
  property: Property
  highlightText?: string
}) => (
  <tr>
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
        {properties(vehicleOrGhost).map(property => (
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
