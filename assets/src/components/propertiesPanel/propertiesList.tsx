import React from "react"

interface Props {
  properties: Property[]
}

export interface Property {
  label: string
  value: string
}

const PropertyRow = ({
  property: { label, value },
}: {
  property: Property
}) => (
  <tr>
    <td className="m-properties-panel__property-label">{label}</td>
    <td className="m-properties-panel__property-value">{value}</td>
  </tr>
)

const PropertiesList = ({ properties }: Props) => (
  <div className="m-properties-panel__properties-list">
    <table>
      <tbody>
        {properties.map(property => (
          <PropertyRow property={property} key={`property-${property.label}`} />
        ))}
      </tbody>
    </table>
  </div>
)

export default PropertiesList
