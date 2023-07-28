import { useEffect, useState } from "react"
import { fetchLocationSearchResults } from "../api"
import { LocationSearchResult } from "../models/locationSearchResult"

export const useLocationSearchResults = (
  text: string | null
): LocationSearchResult[] | null => {
  const [searchResults, setSearchResults] = useState<
    LocationSearchResult[] | null
  >(null)

  useEffect(() => {
    let shouldUpdate = true

    if (text) {
      fetchLocationSearchResults(text).then((results) => {
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
  }, [text])

  return searchResults
}
