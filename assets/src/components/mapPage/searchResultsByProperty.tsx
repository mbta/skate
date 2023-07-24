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

const SearchResultSection = ({
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

const SearchResultsByProperty = ({
  selectSearchResult,
}: {
  selectSearchResult: (result: Vehicle | Ghost | null) => void
}) => {
  const [{ searchPageState }, dispatch] = useContext(StateDispatchContext)
  return (
    <>
      {searchPageState.query.properties
        .sort(
          (first, second) =>
            searchPropertyDisplayConfig[first.property].order -
            searchPropertyDisplayConfig[second.property].order
        )
        .map(({ property, limit }) => (
          <SearchResultSection
            key={property}
            property={property}
            text={searchPageState.query.text}
            limit={limit}
            selectVehicle={selectSearchResult}
            showMore={() =>
              dispatch(setPropertyMatchLimit(property, limit + 25))
            }
          />
        ))}
    </>
  )
}

export default SearchResultsByProperty
