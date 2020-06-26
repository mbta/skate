import React from "react"
import { crowdingIcon } from "../../helpers/icon"
import { Crowding } from "../../realtime"

const extendedOccupancyStatus = (crowding: Crowding): string => {
  // GTFS-RT has an EMPTY occupancy status but we don't use it; an empty
  // crowding will have a MANY_SEATS_AVAILABLE status. Additionally, it's
  // possible that the route this crowding is on generally has crowding data,
  // but it's not working at the moment for this crowding in particular.

  if (crowding.load === null) {
    return "NO_DATA"
  }

  if (crowding.load === 0) {
    return "EMPTY"
  }

  // If crowding.load isn't null, crowding.occupancyStatus shouldn't be either.
  return crowding.occupancyStatus!
}

const GenericCrowdingDiagram = ({
  crowding,
  statusDescription,
}: {
  crowding: Crowding
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
        {crowding.load} riders / {crowding.capacity} maximum
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

const EmptyCrowdingDiagram = ({ crowding }: { crowding: Crowding }) => (
  <GenericCrowdingDiagram crowding={crowding} statusDescription="Empty" />
)

const NotCrowdedCrowdingDiagram = ({ crowding }: { crowding: Crowding }) => (
  <GenericCrowdingDiagram crowding={crowding} statusDescription="Not crowded" />
)

const SomeCrowdingCrowdingDiagram = ({ crowding }: { crowding: Crowding }) => (
  <GenericCrowdingDiagram
    crowding={crowding}
    statusDescription="Some crowding"
  />
)

const CrowdedCrowdingDiagram = ({ crowding }: { crowding: Crowding }) => (
  <GenericCrowdingDiagram crowding={crowding} statusDescription="Crowded" />
)

const CrowdingDiagram = ({ crowding }: { crowding: Crowding | null }) => {
  if (crowding === null) {
    return null
  }

  switch (extendedOccupancyStatus(crowding)) {
    case "NO_DATA":
      return <NoDataCrowdingDiagram />
    case "EMPTY":
      return <EmptyCrowdingDiagram crowding={crowding} />
    case "MANY_SEATS_AVAILABLE":
      return <NotCrowdedCrowdingDiagram crowding={crowding} />
    case "FEW_SEATS_AVAILABLE":
      return <SomeCrowdingCrowdingDiagram crowding={crowding} />
    case "FULL":
      return <CrowdedCrowdingDiagram crowding={crowding} />
  }

  // If we get here, something has gone wrong.
  return null
}

export default CrowdingDiagram
