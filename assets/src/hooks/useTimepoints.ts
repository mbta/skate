import { useEffect, useState } from "react"
import { fetchTimepointsForRoute } from "../api"
import { RouteId, TimepointId, TimepointsByRouteId } from "../skate"

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
    timepointIds: TimepointId[]
  ): void => {
    setTimepointsByRouteId({
      ...timepointsByRouteId,
      [routeId]: timepointIds,
    })
  }

  useEffect(() => {
    selectedRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in timepointsByRouteId)) {
        setLoadingTimepointsForRoute(routeId)

        fetchTimepointsForRoute(routeId).then((newTimepointIds: TimepointId[]) =>
          setTimepointsForRoute(routeId, newTimepointIds)
        )
      }
    })
  }, [selectedRouteIds, timepointsByRouteId])

  return timepointsByRouteId
}

export default useTimepoints
