import React from "react"
import { DiversionPage } from "./diversionPage"
import { StartDetourProps } from "./detourDropdown"

export const DetourModal = ({
  detourInfo,
  onClose,
}: {
  detourInfo: StartDetourProps
  onClose: () => void
}) => {
  return (
    <div className="c-detour-modal">
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
