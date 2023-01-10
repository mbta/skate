import React, { useContext } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isRecentlyLoggedOn, isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime"
import { setSearchText } from "../state/searchPageState"
import { Card, CardProperties } from "./card"
import { vehicleOrGhostProperties } from "./propertiesList"

interface Props {
  vehicles: VehicleOrGhost[]
  onClick: (vehicle: VehicleOrGhost) => void
  selectedVehicleId: string | null
}

const NewBadge = () => (
  <div className="m-search-results__card-new-badge">
    <span className="m-search-results__card-new-badge-label">New</span>
    <span className="m-search-results__card-new-badge-icon">
      <svg viewBox="0 0 9 9" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4.5" cy="4.5" r="4.5" />
      </svg>
    </span>
  </div>
)

const SearchResultCard = ({
  vehicleOrGhost,
  onClick,
}: {
  vehicleOrGhost: VehicleOrGhost
  onClick: (vehicle: VehicleOrGhost) => void
  isSelected: boolean
}) => {
  const { routeId, viaVariant, headsign } = vehicleOrGhost
  const viaVariantFormatted = viaVariant && viaVariant !== "_" ? viaVariant : ""
  const route = useRoute(vehicleOrGhost.routeId)

  const title = `${route?.name || routeId}_${viaVariantFormatted} ${headsign}`

  // TODO: Add highlight of result back
  return (
    <li>
      <Card
        openCallback={() => onClick(vehicleOrGhost)}
        style="white"
        title={title}
      >
        {isRecentlyLoggedOn(vehicleOrGhost) && <NewBadge />}

        <CardProperties properties={vehicleOrGhostProperties(vehicleOrGhost)} />
      </Card>
    </li>
  )
}

const operatorLogonTimeForSorting = (
  vehicleOrGhost: VehicleOrGhost
): Date | undefined =>
  isVehicle(vehicleOrGhost) && vehicleOrGhost.operatorLogonTime !== null
    ? vehicleOrGhost.operatorLogonTime
    : undefined

export const byOperatorLogonTime = (
  a: VehicleOrGhost,
  b: VehicleOrGhost
): number => {
  const operatorLogonTimeA = operatorLogonTimeForSorting(a)
  const operatorLogonTimeB = operatorLogonTimeForSorting(b)

  // Sort ghosts or vehicles without logon times to the top
  if (!operatorLogonTimeA && !operatorLogonTimeB) {
    return 0
  }
  if (!operatorLogonTimeA) {
    return -1
  }
  if (!operatorLogonTimeB) {
    return 1
  }

  if (operatorLogonTimeA > operatorLogonTimeB) {
    return -1
  }
  if (operatorLogonTimeB > operatorLogonTimeA) {
    return 1
  }
  return 0
}

const ResultsList = ({
  vehicles,
  onClick,
  selectedVehicleId,
}: {
  vehicles: VehicleOrGhost[]
  onClick: (vehicle: VehicleOrGhost) => void
  selectedVehicleId: string | null
}) => (
  <ul className="m-search-results__list">
    {vehicles.sort(byOperatorLogonTime).map((vehicleOrGhost) => (
      <SearchResultCard
        vehicleOrGhost={vehicleOrGhost}
        onClick={() => onClick(vehicleOrGhost)}
        isSelected={
          selectedVehicleId ? selectedVehicleId === vehicleOrGhost.id : false
        }
        key={`search-result-card-${vehicleOrGhost.id}`}
      />
    ))}
  </ul>
)

const NoResults = () => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <div className="m-search-results__none">
      <div className="m-search-results__heading">No Search Results</div>

      <p>
        There were no matching results found for “{query.text}”. Please try
        again using numbers or last names only.
      </p>

      <p>
        Please note that at this time search is limited to active vehicles and
        logged-in personnel.
      </p>

      <button
        className="m-search-results__clear-search-button"
        onClick={() => dispatch(setSearchText(""))}
      >
        Clear search
      </button>
    </div>
  )
}

const SearchResults = ({ vehicles, onClick, selectedVehicleId }: Props) => {
  return (
    <div className="m-search-results">
      {vehicles.length ? (
        <ResultsList
          vehicles={vehicles}
          onClick={onClick}
          selectedVehicleId={selectedVehicleId}
        />
      ) : (
        <NoResults />
      )}
    </div>
  )
}

export default SearchResults
