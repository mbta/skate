import React, { ReactElement, ReactNode } from "react"
import { PropsWithChildren, createContext, useContext, useState } from "react"
import { useMap, useMapEvents } from "react-leaflet"

// `undefined` is an invalid state of this context, so the underlying context is not exported
const MapZoomLevelContext = createContext<undefined | number>(undefined)

/**
 * Provides the `zoomLevel` from the {@link Map}
 *
 * @returns The current zoom level of the containing map
 */
export const useMapZoomLevel = () => {
  const ctx = useContext(MapZoomLevelContext)

  if (ctx === undefined) {
    throw new Error(
      "`useMapZoomLevel` must be used within a `MapZoomLevel.Provider`"
    )
  }

  return ctx
}

// Subscribes to zoom changes and stores and provides the state via context
const MapEventZoomLevelProvider = ({ children }: PropsWithChildren) => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(map.getZoom())
  useMapEvents({
    zoom() {
      setZoomLevel(map.getZoom())
    },
  })

  return (
    <MapZoomLevelContext.Provider value={zoomLevel}>
      {children}
    </MapZoomLevelContext.Provider>
  )
}

// Allows multiple `MapZoomLevel.Provider`'s to be used without needing to
// worry about duplicative work
const MapZoomLevelProviderMaybeFromContext = ({
  children,
}: PropsWithChildren) => {
  const ctx = useContext(MapZoomLevelContext)

  // If we're in a `MapZoomLevelContext` already,
  // then we don't need to recompute the zoom level
  if (ctx !== undefined) {
    return <>{children}</>
  }

  // This will error if not used within a Leaflet map
  return <MapEventZoomLevelProvider>{children}</MapEventZoomLevelProvider>
}

// Consumes the zoom level context and provides a `children` callback which
// is typesafe (i.e., excludes the `undefined` part of the `MapZoomLevelContext`)
const MapZoomLevelConsumer = ({
  children,
}: {
  children: (zoomLevel: number) => ReactNode
}) => {
  const zoomLevel = useMapZoomLevel()
  return <>{children(zoomLevel)}</>
}

export const MapZoomLevel = {
  /**
   * Stores and provides the zoom level from the containing map context
   *
   * Must be used within a `<Map/>`
   */
  Provider: MapZoomLevelProviderMaybeFromContext,

  /**
   * Consumes the zoom level context and provides a `children` callback which
   * is typesafe (i.e., excludes the `undefined` part of the `MapZoomLevelContext`)
   */
  Consumer: MapZoomLevelConsumer,
}

const ZoomLevelWrapper = ({
  children,
}: {
  children: (zoomLevel: number) => ReactElement
}) => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(map.getZoom())
  map.addEventListener("zoomend", () => setZoomLevel(map.getZoom()))
  return children(zoomLevel)
}
export default ZoomLevelWrapper
