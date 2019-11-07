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
}) => {
  if (highlightText === undefined) {
    return <>{content}</>
  }

  return (
    <>
      {content.split(highlightText).reduce(
        (acc, str, i) => {
          if (i === 0) {
            return [<React.Fragment key={i}>{str}</React.Fragment>]
          }

          return acc.concat([
            <span className="highlighted" key={`highlighted-${i}`}>
              {highlightText}
            </span>,
            <React.Fragment key={i}>{str}</React.Fragment>,
          ])
        },
        [] as JSX.Element[]
      )}
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
