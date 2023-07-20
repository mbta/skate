import { useEffect, useState } from "react"
import { fetchLocationSearchResults } from "../api"
import { LocationSearchResult } from "../models/locationSearchResult"
import { SearchQuery } from "../models/searchQuery"

export const useLocationSearchResults = (
  searchQuery: SearchQuery | null
): LocationSearchResult[] | null => {
  const [searchResults, setSearchResults] = useState<
    LocationSearchResult[] | null
  >(null)

  useEffect(() => {
    let shouldUpdate = true

    // TODO: also make sure location is among selected categories
    if (searchQuery) {
      fetchLocationSearchResults(searchQuery.text).then((results) => {
        if (shouldUpdate) {
          setSearchResults(results)
        }
      })
    } else {
      setSearchResults(null)
    }

    return () => {
      shouldUpdate = false
    }
  }, [searchQuery])

  return searchResults
}
