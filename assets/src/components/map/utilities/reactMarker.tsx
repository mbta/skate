import React, { ReactNode } from "react"
import { createPortal } from "react-dom"

import { DivIconOptions } from "leaflet"
import { Marker, MarkerProps } from "react-leaflet"

import Loading from "../../loading"
import { useReactDivIcon } from "./reactDivIcon"

interface ReactMarkerProps extends Partial<Omit<MarkerProps, "icon">> {
  // Shadow `MarkerProps.icon` with a custom React compatible implementation
  /**
   * React Element to use as Marker Icon
   */
  icon?: ReactNode
  /**
   * Element to show when `divIcon` is not ready
   *
   * Defaults to `<Loading/>`
   */
  loadingState?: ReactNode
  /**
   * Options to pass to `Leaflet.DivIcon`
   *
   * Defaults to `{}`
   */
  divIconSettings?: Partial<DivIconOptions>
}

export const ReactMarker = ({
  icon,
  loadingState,
  divIconSettings = {},
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
          so any Events to Icon should bubble up to `Marker` first
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
