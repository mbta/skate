import { useEffect, useState } from "react"
import { fetchNearestIntersection } from "../api"
import { FetchResult } from "../util/fetchResult"

export const useNearestIntersection = (
  latitude: number,
  longitude: number
): FetchResult<string> => {
  const [result, setResult] = useState<FetchResult<string>>({
    is_loading: true,
  })

  useEffect(() => {
    let shouldUpdate = true

    setResult((oldResult) => {
      return { ...oldResult, is_loading: true }
    })

    fetchNearestIntersection(latitude, longitude).then((result) => {
      if (shouldUpdate) {
        if (result) {
          setResult({ ok: result })
        } else {
          setResult({ is_error: true })
        }
      }
    })

    return () => {
      shouldUpdate = false
    }
  }, [latitude, longitude])

  return result
}
