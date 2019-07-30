import { useEffect, useState } from "react"
import { fetchTimepointsForRoute } from "../api"
import { RouteId, TimepointId, TimepointsByRouteId } from "../schedule.d"

const useTimepoints = (selectedRouteIds: RouteId[]): TimepointsByRouteId => {
  const [timepointsByRouteId, setTimepointsByRouteId] = useState<
    TimepointsByRouteId
  >({})

  const setLoadingTimepointsForRoute = (routeId: RouteId): void => {
    setTimepointsByRouteId(previousTimepointsByRouteId => ({
      ...previousTimepointsByRouteId,
      [routeId]: null,
    }))
  }

  const setTimepointsForRoute = (
    routeId: RouteId,
    timepoints: TimepointId[]
  ): void => {
    setTimepointsByRouteId(previousTimepointsByRouteId => ({
      ...previousTimepointsByRouteId,
      [routeId]: timepoints,
    }))
  }

  useEffect(() => {
    selectedRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in timepointsByRouteId)) {
        setLoadingTimepointsForRoute(routeId)

        fetchTimepointsForRoute(routeId).then((newTimepoints: TimepointId[]) =>
          setTimepointsForRoute(routeId, newTimepoints)
        )
      }
    })
  }, [selectedRouteIds, timepointsByRouteId])

  return timepointsByRouteId
}

export default useTimepoints
