import { useCallback } from "react"
import { fetchNearestIntersection } from "../api"
import { useApiCall } from "./useApiCall"
import { ShapePoint } from "../schedule"

export const useNearestIntersection = (
  startPoint: ShapePoint | null
) => useApiCall({
  apiCall: useCallback(async () => {
    if (startPoint) {
      return fetchNearestIntersection(startPoint.lat, startPoint.lon)
    } else {
      return null
    }
  }, [startPoint])
})
