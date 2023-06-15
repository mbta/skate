import React, { ReactNode } from "react"
import { createPortal } from "react-dom"

import { Marker, MarkerProps } from "react-leaflet"

import Loading from "../../loading"
import { DivIconOptions, useReactDivIcon } from "./reactDivIcon"

/**
 * Component Props for {@link ReactMarker}
 *
 * @see {@link ReactMarker}
 */
export interface ReactMarkerProps extends Omit<MarkerProps, "icon"> {
  // Shadow `MarkerProps.icon` with a custom React compatible implementation
  /**
   * React Element to use as {@link Marker} Icon
   */
  icon?: ReactNode
  /**
   * Element to show before `divIcon` is ready
   *
   * Defaults to {@link Loading `<Loading/>`}
   */
  loadingState?: ReactNode
  /**
   * Options to pass to {@link useReactDivIcon}
   */
  divIconSettings?: DivIconOptions
}

/**
 * A Drop-in replacement for {@link Marker React Leaflet's Marker} which
 * defines the `icon` property with React Nodes, allowing for dynamic changes to
 * the icon on the map.
 *
 * Use this to put custom icons made with React in `ReactLeaflet.MapContainer`'s.
 *
 * @param {ReactMarkerProps} props Component Props with {@link DivIconOptions `divIconSettings`}
 */
export const ReactMarker = ({
  icon,
  loadingState,
  divIconSettings,
  children,
  ...markerProps
}: ReactMarkerProps) => {
  const { divIcon, iconContainer } = useReactDivIcon(divIconSettings)

  if (!(divIcon && iconContainer)) {
    return <>{loadingState || <Loading />}</>
  }

  return (
    <Marker {...(markerProps as MarkerProps)} icon={divIcon}>
      <>
        {
          /*
          React Events bubble up the React Virtual DOM,
          so any Events to `icon` should bubble up to `Marker` first
          */
          createPortal(icon, iconContainer)
        }

        {
          /* Provide children after portal so react has a stable virtual DOM reference */
          children
        }
      </>
    </Marker>
  )
}
