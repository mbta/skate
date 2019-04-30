import { useEffect, useState } from "react"
import { fetchTimepointsForRoute } from "../api"
import { RouteId, Timepoint, TimepointsByRouteId } from "../skate"

const useTimepoints = (selectedRouteIds: RouteId[]): TimepointsByRouteId => {
  const [timepointsByRouteId, setTimepointsByRouteId] = useState<
    TimepointsByRouteId
  >({})

  const setLoadingTimepointsForRoute = (routeId: RouteId): void => {
    setTimepointsByRouteId({
      ...timepointsByRouteId,
      [routeId]: null,
    })
  }

  const setTimepointsForRoute = (
    routeId: RouteId,
    timepoints: Timepoint[]
  ): void => {
    setTimepointsByRouteId({
      ...timepointsByRouteId,
      [routeId]: timepoints,
    })
  }

  useEffect(() => {
    selectedRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in timepointsByRouteId)) {
        setLoadingTimepointsForRoute(routeId)

        fetchTimepointsForRoute(routeId).then((newTimepoints: Timepoint[]) =>
          setTimepointsForRoute(routeId, newTimepoints)
        )
      }
    })
  }, [selectedRouteIds, timepointsByRouteId])

  return timepointsByRouteId
}

export default useTimepoints
