import { useContext } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { LimitedSearchResults } from "../../hooks/useSearchResults"
import {
  SearchProperty,
  searchPropertyDisplayConfig,
} from "../../models/searchQuery"
import { Vehicle, Ghost } from "../../realtime"
import { setPropertyMatchLimit } from "../../state/searchPageState"
import SearchResults, { NoResults } from "../searchResults"
import React from "react"
import { Card, CardBody } from "../card"
import { LocationSearchResult } from "../../models/locationSearchResult"
import {
  Loading as LoadingResult,
  Ok,
  isLoading,
  isOk,
} from "../../util/fetchResult"
import Loading from "../loading"
import useSearchResultsByProperty from "../../hooks/useSearchResultsByProperty"

const VehicleSearchResultSection = ({
  property,
  results,
  onSelectVehicle,
  onShowMore,
}: {
  property: SearchProperty
  results: LoadingResult | Ok<LimitedSearchResults<Vehicle | Ghost>> | null
  onSelectVehicle: (vehicle: Vehicle | Ghost) => void
  onShowMore: () => void
}) => {
  if (results === null || (isOk(results) && results.ok.matches.length === 0)) {
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
      {isLoading(results) ? (
        <Loading />
      ) : results.ok.matches.length > 0 ? (
        <>
          <SearchResults
            vehicles={results.ok.matches}
            selectedVehicleId={null}
            onClick={onSelectVehicle}
          />
          {results.ok.hasMoreMatches && (
            <div className="c-map_page__search_results_actions">
              <button
                className="c-map-page__show_more button-text"
                onClick={() => onShowMore()}
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
  results,
  onSelectLocation,
  onShowMore,
}: {
  results: LoadingResult | Ok<LimitedSearchResults<LocationSearchResult>> | null
  onSelectLocation: (location: LocationSearchResult) => void
  onShowMore: () => void
}) => {
  if (results === null || (isOk(results) && results.ok.matches.length === 0)) {
    return <></>
  }
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
      {isLoading(results) ? (
        <Loading />
      ) : (
        <>
          <ul className="c-search-results__list">
            {results.ok.matches.map((locationSearchResult) => (
              <li key={locationSearchResult.id}>
                <Card
                  style="white"
                  title={
                    locationSearchResult.name || locationSearchResult.address
                  }
                  openCallback={() => onSelectLocation(locationSearchResult)}
                >
                  {locationSearchResult.name &&
                    locationSearchResult.address && (
                      <CardBody>{locationSearchResult.address}</CardBody>
                    )}
                </Card>
              </li>
            ))}
          </ul>
          {results.ok.hasMoreMatches && (
            <div className="c-map_page__search_results_actions">
              <button
                className="c-map-page__show_more button-text"
                onClick={() => onShowMore()}
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

const onShowMore = (property: SearchProperty, currentLimit: number): void => {
  const [_state, dispatch] = useContext(StateDispatchContext)

  dispatch(setPropertyMatchLimit(property, currentLimit + 25))
}

const SearchResultsByProperty = ({
  onSelectVehicleResult,
  onSelectLocationResult,
}: {
  onSelectVehicleResult: (result: Vehicle | Ghost | null) => void
  onSelectLocationResult: (result: LocationSearchResult | null) => void
}) => {
  const [{ searchPageState }] = useContext(StateDispatchContext)
  const { socket } = useContext(SocketContext)
  const resultsByProperty = useSearchResultsByProperty(
    socket,
    searchPageState.query.text,
    searchPageState.query.properties
  )

  const searchHasNoResults = Object.values(resultsByProperty)
    .filter(
      (
        result
      ): result is
        | LoadingResult
        | Ok<LimitedSearchResults<Vehicle | Ghost>>
        | Ok<LimitedSearchResults<LocationSearchResult>> => result !== null
    )
    .every(
      (result) => !("is_loading" in result) && result.ok.matches.length === 0
    )

  return (
    <div aria-label="Grouped Search Results">
      {searchHasNoResults ? (
        <NoResults />
      ) : (
        Object.entries(searchPageState.query.properties)
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
          .map(({ property, limit }) =>
            property === "location" ? (
              <LocationSearchResultSection
                key={property}
                results={resultsByProperty[property]}
                onSelectLocation={onSelectLocationResult}
                onShowMore={() => onShowMore(property, limit)}
              />
            ) : (
              <VehicleSearchResultSection
                key={property}
                property={property}
                results={resultsByProperty[property]}
                onSelectVehicle={onSelectVehicleResult}
                onShowMore={() => onShowMore(property, limit)}
              />
            )
          )
      )}
    </div>
  )
}

export default SearchResultsByProperty
