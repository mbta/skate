import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { setSearchText } from "../models/search"
import { isAVehicle } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { selectVehicle } from "../state"
import PropertiesList from "./propertiesList"
import { RouteVariantName } from "./routeVariantName"

interface Props {
  vehicles: VehicleOrGhost[]
}

const SearchResultsNote = () => (
  <p className="m-search-results__note">
    Please note that at this time search is limited to active vehicles and
    logged-in personnel.
  </p>
)

const RouteLabel = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-search-results__card-route-label">
    <RouteVariantName vehicle={vehicle} />
  </div>
)

const SearchResultCard = ({
  vehicleOrGhost,
}: {
  vehicleOrGhost: VehicleOrGhost
}) => {
  const [{ search }, dispatch] = useContext(StateDispatchContext)

  const selectVehicleOrGhost = () => dispatch(selectVehicle(vehicleOrGhost.id))

  return (
    <div className="m-search-results__card" onClick={selectVehicleOrGhost}>
      <PropertiesList
        vehicleOrGhost={vehicleOrGhost}
        highlightText={search.text}
      />

      {isAVehicle(vehicleOrGhost) && <RouteLabel vehicle={vehicleOrGhost} />}
    </div>
  )
}

const NoResults = () => {
  const [{ search }, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="m-search-results--none">
      <div className="m-search-results__heading">No Search Results</div>

      <p>
        There were no matching results found for “{search.text}”. Please try
        again using numbers or last names only.
      </p>

      <SearchResultsNote />

      <button
        className="m-search-results__clear-search-button"
        onClick={() => dispatch(setSearchText(""))}
      >
        Clear search
      </button>
    </div>
  )
}

const SearchResults = ({ vehicles }: Props) => (
  <div className="m-search-results">
    {vehicles.length ? (
      <div className="m-search-results__list">
        {vehicles.map(vehicleOrGhost => (
          <SearchResultCard
            vehicleOrGhost={vehicleOrGhost}
            key={`search-result-card-${vehicleOrGhost.id}`}
          />
        ))}
        <SearchResultsNote />
      </div>
    ) : (
      <NoResults />
    )}
  </div>
)

export default SearchResults
