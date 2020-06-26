import React from "react"
import { crowdingIcon } from "../../helpers/icon"
import { Vehicle } from "../../realtime"

const extendedOccupancyStatus = (vehicle: Vehicle): string => {
  // GTFS-RT has an EMPTY occupancy status but we don't use it; an empty
  // vehicle will have a MANY_SEATS_AVAILABLE status. Additionally, it's
  // possible that the route this vehicle is on generally has crowding data,
  // but it's not working at the moment for this vehicle in particular.

  if (vehicle.load === null) {
    return "NO_DATA"
  }

  if (vehicle.load === 0) {
    return "EMPTY"
  }

  // If vehicle.load isn't null, vehicle.occupancyStatus shouldn't be either.
  return vehicle.occupancyStatus!
}

const GenericCrowdingDiagram = ({
  vehicle,
  statusDescription,
}: {
  vehicle: Vehicle
  statusDescription: string
}) => {
  const classModifier = statusDescription.toLowerCase().replace(" ", "-")

  return (
    <div className="m-crowding-diagram">
      <div className="m-crowding-diagram__properties">
        <span className="m-properties-list__property-label">
          Riders onboard
        </span>
        <br />
        {vehicle.load} riders / {vehicle.capacity} maximum
        <br />
        <span
          className={`m-crowding-diagram__status-description m-crowding-diagram__status-description--${classModifier}`}
        >
          {statusDescription}
        </span>
      </div>
      <div className="m-crowding-diagram__crowding-icon-wrapper">
        {crowdingIcon(
          `m-crowding-diagram__crowding-icon m-crowding-diagram__crowding-icon--${classModifier}`
        )}
      </div>
    </div>
  )
}

const NoDataCrowdingDiagram = () => (
  <div className="m-crowding-diagram">
    <div className="m-crowding-diagram__properties">
      <span className="m-properties-list__property-label">Riders onboard</span>
      <br />
      No data available.
      <br />
    </div>
    <div className="m-crowding-diagram__crowding-icon-wrapper">
      {crowdingIcon(
        "m-crowding-diagram__crowding-icon m-crowding-diagram__crowding-icon--empty"
      )}
    </div>
  </div>
)

const EmptyCrowdingDiagram = ({ vehicle }: { vehicle: Vehicle }) => (
  <GenericCrowdingDiagram vehicle={vehicle} statusDescription="Empty" />
)

const NotCrowdedCrowdingDiagram = ({ vehicle }: { vehicle: Vehicle }) => (
  <GenericCrowdingDiagram vehicle={vehicle} statusDescription="Not crowded" />
)

const SomeCrowdingCrowdingDiagram = ({ vehicle }: { vehicle: Vehicle }) => (
  <GenericCrowdingDiagram vehicle={vehicle} statusDescription="Some crowding" />
)

const CrowdedCrowdingDiagram = ({ vehicle }: { vehicle: Vehicle }) => (
  <GenericCrowdingDiagram vehicle={vehicle} statusDescription="Crowded" />
)

const CrowdingDiagram = ({ vehicle }: { vehicle: Vehicle }) => {
  if (!vehicle.routeHasReliableCrowdingData) {
    return null
  }

  switch (extendedOccupancyStatus(vehicle)) {
    case "NO_DATA":
      return <NoDataCrowdingDiagram />
    case "EMPTY":
      return <EmptyCrowdingDiagram vehicle={vehicle} />
    case "MANY_SEATS_AVAILABLE":
      return <NotCrowdedCrowdingDiagram vehicle={vehicle} />
    case "FEW_SEATS_AVAILABLE":
      return <SomeCrowdingCrowdingDiagram vehicle={vehicle} />
    case "FULL":
      return <CrowdedCrowdingDiagram vehicle={vehicle} />
  }

  // If we get here, something has gone wrong.
  return null
}

export default CrowdingDiagram
