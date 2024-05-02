import { useEffect, useState } from "react"
import { fetchNearestIntersection } from "../api"
import { FetchResult, loading } from "../util/fetchResult"

export const useNearestIntersection = (
  latitude: number | undefined,
  longitude: number | undefined
): FetchResult<string | null> => {
  const [result, setResult] = useState<FetchResult<string | null>>({
    is_loading: true,
  })

  useEffect(() => {
    let shouldUpdate = true

    setResult((oldResult) => {
      return { ...oldResult, is_loading: true }
    })

    if (latitude && longitude) {
      fetchNearestIntersection(latitude, longitude).then((result) => {
        if (shouldUpdate) {
          if (result) {
            setResult({ ok: result })
          } else {
            setResult({ is_error: true })
          }
        }
      })
    } else setResult(loading())

    return () => {
      shouldUpdate = false
    }
  }, [latitude, longitude])

  return result
}
