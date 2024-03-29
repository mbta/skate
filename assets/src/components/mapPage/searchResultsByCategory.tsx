import { useContext } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { LimitedSearchResults } from "../../hooks/useSearchResults"
import { SearchResultCategory } from "../../models/searchQuery"
import { Vehicle, Ghost } from "../../realtime"
import SearchResults, { NoResults } from "../searchResults"
import React from "react"
import { LocationSearchResult } from "../../models/locationSearchResult"
import {
  Loading as LoadingResult,
  Ok,
  isLoading,
  isOk,
} from "../../util/fetchResult"
import Loading from "../loading"
import useSearchResultsByCategory from "../../hooks/useSearchResultsByCategory"
import { setCategoryMatchLimit } from "../../state/searchPageState"
import LocationCard from "./locationCard"

const VehicleSearchResultSection = ({
  results,
  onSelectVehicle,
}: {
  results: LoadingResult | Ok<LimitedSearchResults<Vehicle | Ghost>> | null
  onSelectVehicle: (vehicle: Vehicle | Ghost) => void
}) => {
  if (results === null || (isOk(results) && results.ok.matches.length === 0)) {
    return <></>
  }

  return (
    <section
      className="c-map-page__search_results_section"
      aria-labelledby="search-results__vehicle"
    >
      <h2
        className="c-map-page__search_results_header"
        id="search-results__vehicle"
      >
        Buses
      </h2>
      {isLoading(results) ? (
        <Loading />
      ) : (
        <>
          <SearchResults
            vehicles={results.ok.matches}
            selectedVehicleId={null}
            onClick={onSelectVehicle}
          />
          {results.ok.hasMoreMatches && <ShowMore category={"vehicle"} />}
        </>
      )}
    </section>
  )
}

const LocationSearchResultSection = ({
  results,
  onSelectLocation,
  highlightText,
}: {
  results: LoadingResult | Ok<LimitedSearchResults<LocationSearchResult>> | null
  onSelectLocation: (location: LocationSearchResult) => void
  highlightText?: string
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
        Locations
      </h2>
      {isLoading(results) ? (
        <Loading />
      ) : (
        <>
          <ul className="c-search-results__list">
            {results.ok.matches.map((locationSearchResult) => (
              <li key={locationSearchResult.id}>
                <LocationCard
                  location={locationSearchResult}
                  onSelectLocation={onSelectLocation}
                  highlightText={highlightText}
                />
              </li>
            ))}
          </ul>
          {results.ok.hasMoreMatches && <ShowMore category={"location"} />}
        </>
      )}
    </section>
  )
}

const ShowMore = ({ category }: { category: SearchResultCategory }) => {
  const [{ searchPageState }, dispatch] = useContext(StateDispatchContext)
  const currentLimit = searchPageState.query.categoryResultLimits[category]
  return (
    <div className="c-map_page__search_results_actions">
      <button
        className="c-map-page__show_more button-text"
        onClick={() =>
          dispatch(setCategoryMatchLimit(category, currentLimit + 25))
        }
      >
        Show more
      </button>
    </div>
  )
}

const SearchResultsByCategory = ({
  onSelectVehicleResult,
  onSelectLocationResult,
}: {
  onSelectVehicleResult: (result: Vehicle | Ghost | null) => void
  onSelectLocationResult: (result: LocationSearchResult | null) => void
}) => {
  const [
    {
      searchPageState: { query },
    },
  ] = useContext(StateDispatchContext)
  const { socket } = useContext(SocketContext)
  const resultsByProperty = useSearchResultsByCategory(
    socket,
    query.text,
    query.property,
    query.categoryResultLimits
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
        <>
          {(query.property === "all" || query.property !== "location") && (
            <VehicleSearchResultSection
              results={resultsByProperty.vehicle}
              onSelectVehicle={onSelectVehicleResult}
            />
          )}

          {(query.property === "all" || query.property === "location") && (
            <LocationSearchResultSection
              results={resultsByProperty.location}
              onSelectLocation={onSelectLocationResult}
              highlightText={query.text}
            />
          )}
        </>
      )}
    </div>
  )
}

export default SearchResultsByCategory
