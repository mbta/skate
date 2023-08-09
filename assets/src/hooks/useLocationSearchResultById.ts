import { useEffect, useState } from "react"
import { fetchLocationSearchResultById } from "../api"
import { LocationSearchResult } from "../models/locationSearchResult"

export const useLocationSearchResultById = (
  placeId: string | null
): LocationSearchResult | null => {
  const [searchResult, setSearchResult] = useState<LocationSearchResult | null>(
    null
  )

  useEffect(() => {
    let shouldUpdate = true

    if (placeId) {
      fetchLocationSearchResultById(placeId).then((results) => {
        if (shouldUpdate) {
          setSearchResult(results)
        }
      })
    } else {
      setSearchResult(null)
    }

    return () => {
      shouldUpdate = false
    }
  }, [placeId])

  return searchResult
}
