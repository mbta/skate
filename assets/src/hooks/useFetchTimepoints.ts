import { useEffect } from "react"
import { fetchTimepointsForRoute } from "../api"
import { RouteId, Timepoint, TimepointsByRouteId } from "../skate"
import {
  Dispatch,
  setLoadingTimepointsForRoute,
  setTimepointsForRoute,
} from "../state"

export const useFetchTimepoints = (
  selectedRouteIds: RouteId[],
  timepointsByRouteId: TimepointsByRouteId,
  dispatch: Dispatch
): void => {
  useEffect(() => {
    selectedRouteIds.forEach((routeId: RouteId) => {
      if (!(routeId in timepointsByRouteId)) {
        dispatch(setLoadingTimepointsForRoute(routeId))

        fetchTimepointsForRoute(routeId).then((newTimepoints: Timepoint[]) =>
          dispatch(setTimepointsForRoute(routeId, newTimepoints))
        )
      }
    })
  }, [selectedRouteIds])
}
