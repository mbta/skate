import { useContext } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { useLimitedSearchResults } from "../../hooks/useSearchResults"
import {
  SearchProperty,
  searchPropertyDisplayConfig,
} from "../../models/searchQuery"
import { Vehicle, Ghost } from "../../realtime"
import { setPropertyMatchLimit } from "../../state/searchPageState"
import Loading from "../loading"
import SearchResults from "../searchResults"
import React from "react"
import { useLocationSearchResults } from "../../hooks/useLocationSearchResults"
import { Card, CardBody } from "../card"
import { LocationSearchResult } from "../../models/locationSearchResult"

const SearchResultSection = (props: {
  property: SearchProperty
  text: string
  limit: number
  selectVehicle: (vehicle: Vehicle | Ghost) => void
  selectLocation: (location: LocationSearchResult) => void
  showMore: () => void
}) => {
  if (props.property === "location") {
    return <LocationSearchResultSection {...props} />
  } else {
    return <VehicleSearchResultSection {...props} />
  }
}

const VehicleSearchResultSection = ({
  property,
  text,
  limit,
  selectVehicle,
  showMore,
}: {
  property: SearchProperty
  text: string
  limit: number
  selectVehicle: (vehicle: Vehicle | Ghost) => void
  showMore: () => void
}) => {
  const { socket } = useContext(SocketContext)
  const limitedSearchResults = useLimitedSearchResults(socket, {
    property,
    text,
    limit,
  })

  if (limitedSearchResults?.matchingVehicles.length === 0) {
    return <></>
  }

  return (
    <section
      className="c-map-page__search_results_section"
      aria-labelledby={`search-results__${property}`}
    >
      <h2
        className="c-map-page__search_results_header"
        id={`search-results__${property}`}
      >
        {searchPropertyDisplayConfig[property].name}
      </h2>
      {limitedSearchResults == null ? (
        <Loading />
      ) : limitedSearchResults.matchingVehicles.length > 0 ? (
        <>
          <SearchResults
            vehicles={limitedSearchResults.matchingVehicles}
            selectedVehicleId={null}
            onClick={selectVehicle}
          />
          {limitedSearchResults.hasMoreMatches && (
            <div className="c-map_page__search_results_actions">
              <button
                className="c-map-page__show_more button-text"
                onClick={() => showMore()}
              >
                Show more
              </button>
            </div>
          )}
        </>
      ) : (
        "No results found"
      )}
    </section>
  )
}

const LocationSearchResultSection = ({
  text,
  limit,
  selectLocation,
  showMore,
}: {
  text: string
  limit: number
  selectLocation: (location: LocationSearchResult) => void
  showMore: () => void
}) => {
  const locationSearchResults = useLocationSearchResults(text)

  return (
    <section
      className="c-map-page__search_results_section"
      aria-labelledby={`search-results__location`}
    >
      <h2
        className="c-map-page__search_results_header"
        id={`search-results__location`}
      >
        {searchPropertyDisplayConfig.location.name}
      </h2>
      {locationSearchResults === null ? (
        <Loading />
      ) : locationSearchResults.length > 0 ? (
        <>
          <ul className="c-search-results__list">
            {locationSearchResults
              .slice(0, limit)
              .map((locationSearchResult) => (
                <li key={locationSearchResult.id}>
                  <Card
                    style="white"
                    title={
                      locationSearchResult.name || locationSearchResult.address
                    }
                    openCallback={() => selectLocation(locationSearchResult)}
                  >
                    {locationSearchResult.name &&
                      locationSearchResult.address && (
                        <CardBody>{locationSearchResult.address}</CardBody>
                      )}
                  </Card>
                </li>
              ))}
          </ul>
          {locationSearchResults.length > limit && (
            <div className="c-map_page__search_results_actions">
              <button
                className="c-map-page__show_more button-text"
                onClick={() => showMore()}
              >
                Show more
              </button>
            </div>
          )}
        </>
      ) : (
        "No results found"
      )}
    </section>
  )
}

const SearchResultsByProperty = ({
  selectVehicleResult,
  selectLocationResult,
}: {
  selectVehicleResult: (result: Vehicle | Ghost | null) => void
  selectLocationResult: (result: LocationSearchResult | null) => void
}) => {
  const [{ searchPageState }, dispatch] = useContext(StateDispatchContext)

  return (
    <div aria-label="Grouped Search Results">
      {Object.entries(searchPageState.query.properties)
        .filter(([, limit]) => limit != null)
        .map(([property, limit]) => ({
          property: property as SearchProperty,
          limit: limit as number,
        }))
        .sort(
          ({ property: first_property }, { property: second_property }) =>
            searchPropertyDisplayConfig[first_property].order -
            searchPropertyDisplayConfig[second_property].order
        )
        .map(({ property, limit }) => (
          <SearchResultSection
            key={property}
            property={property}
            text={searchPageState.query.text}
            limit={limit}
            selectVehicle={selectVehicleResult}
            selectLocation={selectLocationResult}
            showMore={() =>
              dispatch(setPropertyMatchLimit(property, limit + 25))
            }
          />
        ))}
    </div>
  )
}

export default SearchResultsByProperty
