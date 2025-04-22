import { useEffect, useState, useCallback } from "react"
import { fetchTimepointsForRoute } from "../api"
import {
  RouteId,
  Timepoint,
  TimepointsByRouteId,
  TimepointNameById,
} from "../schedule.d"
import { useApiCall } from "./useApiCall"

const useTimepoints = (selectedRouteIds: RouteId[]): TimepointsByRouteId => {
  const [timepointsByRouteId, setTimepointsByRouteId] =
    useState<TimepointsByRouteId>({})

  const setLoadingTimepointsForRoute = (routeId: RouteId): void => {
    setTimepointsByRouteId((previousTimepointsByRouteId) => ({
      ...previousTimepointsByRouteId,
      [routeId]: null,
    }))
  }

  const setTimepointsForRoute = (
    routeId: RouteId,
    timepoints: Timepoint[]
  ): void => {
    setTimepointsByRouteId((previousTimepointsByRouteId) => ({
      ...previousTimepointsByRouteId,
      [routeId]: timepoints,
    }))
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

const useTimepointsForRoute = (routeId: RouteId | undefined) =>
  useApiCall({
    apiCall: useCallback(async () => {
      if (!routeId) {
        return null
      }

      return fetchTimepointsForRoute(routeId)
    }, [routeId]),
  })

export const useTimepointsByIdForRoute = (
  routeId: RouteId | null
): TimepointNameById | null => {
  const { result: timepoints } = useTimepointsForRoute(routeId ?? undefined)

  if (timepoints === undefined || timepoints === null) {
    return null
  }

  return new Map(timepoints.map((timepoint) => [timepoint.id, timepoint.name]))
}

export default useTimepoints
