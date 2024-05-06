import { useCallback } from "react"
import { fetchNearestIntersection } from "../api"
import { FetchResult, loading, ok, fetchError } from "../util/fetchResult"
import { useApiCall } from "./useApiCall"

/**
 * @deprecated use {@linkcode useNearestIntersection}
 *
 * [Refactor `useNearestIntersectionFetchResult` away from `FetchResult`](https://app.asana.com/0/1148853526253420/1207213296687090/f)
 */
export const useNearestIntersectionFetchResult = (
  latitude: number | undefined,
  longitude: number | undefined
): FetchResult<string> => {
  const result = useNearestIntersection({ latitude, longitude })

  // Temporary code to convert to the old function shape
  if (result.isLoading) {
    if (result.result !== undefined) {
      return { ...ok(result.result), ...loading() }
    } else {
      return loading()
    }
  } else {
    if (result.result === undefined || result.result === null) {
      return fetchError()
    }

    return ok(result.result)
  }
}

const useNearestIntersection = ({
  latitude,
  longitude,
}: {
  latitude: number | undefined
  longitude: number | undefined
}) =>
  useApiCall({
    apiCall: useCallback(async () => {
      if (!latitude || !longitude) {
        return null
      }

      return fetchNearestIntersection(latitude, longitude)
    }, [latitude, longitude]),
  })
