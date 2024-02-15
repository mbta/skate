import React from "react"
import { DiversionPage } from "./diversionPage"
import { StartDetourProps } from "./detourDropdown"
import { joinClasses } from "../../helpers/dom"

export const DetourModal = ({
  detourInfo,
  onClose,
  show,
}: {
  detourInfo: StartDetourProps
  onClose: () => void
  show: boolean
}) => {
  return (
    <div
      className={joinClasses([
        "c-detour-modal",
        !show && "c-detour-modal__hidden",
      ])}
    >
      <DiversionPage
        onClose={onClose}
        routeName={detourInfo.routeName}
        routeDescription={detourInfo.routeDescription}
        routeOrigin={detourInfo.routeOrigin}
        routeDirection={detourInfo.routeDirection}
        shape={detourInfo.shape}
        center={detourInfo.center}
        zoom={detourInfo.zoom}
      />
    </div>
  )
}
