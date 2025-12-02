import { useEffect, useState } from "react"
import { calculateGeographicCenter } from "../util/geoUtils"
import { LatLngLiteral } from "leaflet"
import { Shape } from "../schedule"

export const useMapZoomAndCenter = (
  routeDirection: string,
  routeName: string,
  shape: Shape | null | undefined,
  useDetourProps:
    | { originalRoute: { center: LatLngLiteral; zoom: number } }
    | object,
  useLatLngParams?: boolean
) => {
  const [mapCenter, setMapCenter] = useState<LatLngLiteral | undefined>(
    undefined
  )

  const [previousRouteDirection, setPreviousRouteDirection] = useState<
    string | undefined
  >(routeDirection)
  const [previousRouteName, setPreviousRouteName] = useState<
    string | undefined
  >(routeName)
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined)
  const useDetourPropsCenter =
    "originalRoute" in useDetourProps && useDetourProps.originalRoute.center
  const useDetourPropsZoomLevel =
    "originalRoute" in useDetourProps
      ? useDetourProps.originalRoute.zoom
      : undefined
  useEffect(() => {
    const shapeCenter = shape?.points && calculateGeographicCenter(shape.points)
    const newMapCenter = shapeCenter || useDetourPropsCenter || undefined
    const directionChanged = previousRouteDirection !== routeDirection
    const routeChanged = previousRouteName !== routeName
    const zoomChanged =
      useDetourPropsZoomLevel !== undefined &&
      useDetourPropsZoomLevel !== mapZoom
    const shapeChanged =
      newMapCenter?.lat !== mapCenter?.lat &&
      newMapCenter?.lng !== mapCenter?.lng

    if (useLatLngParams) {
      setMapCenter(useDetourPropsCenter || undefined)
      setMapZoom(useDetourPropsZoomLevel)
    } else if (!routeChanged && directionChanged) {
      setPreviousRouteDirection(routeDirection)
    } else if (shapeChanged || routeChanged) {
      setPreviousRouteName(routeName)
      setMapCenter(newMapCenter)
      setMapZoom(13)
    } else if (zoomChanged) {
      setMapZoom(useDetourPropsZoomLevel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    routeDirection,
    routeName,
    shape,
    useDetourPropsCenter,
    useDetourPropsZoomLevel,
  ])
  return { mapCenter, mapZoom, setMapCenter, setMapZoom }
}
