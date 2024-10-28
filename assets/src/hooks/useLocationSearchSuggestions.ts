import { useEffect, useState } from "react"
import { fetchLocationSearchSuggestions } from "../api"
import { LocationSearchSuggestion } from "../models/locationSearchSuggestion"

export const useLocationSearchSuggestions = (
  text: string | null
): LocationSearchSuggestion[] | null => {
  const [searchSuggestions, setSearchSuggestions] = useState<
    LocationSearchSuggestion[] | null
  >(null)

  useEffect(() => {
    let shouldUpdate = true

    if (text) {
      fetchLocationSearchSuggestions(text).then((results) => {
        if (shouldUpdate) {
          setSearchSuggestions(results)
        }
      })
    } else {
      setSearchSuggestions(null)
    }

    return () => {
      shouldUpdate = false
    }
  }, [text])

  return searchSuggestions
}
