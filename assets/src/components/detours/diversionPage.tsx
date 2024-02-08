import React from "react"
import { DiversionPanel, DiversionPanelProps } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { Shape } from "../../schedule"
import { useDetour } from "../../hooks/useDetour"
import { CloseButton } from "react-bootstrap"
import { LatLngLiteral } from "leaflet"

export const DiversionPage = ({
  missedStops,
  routeName,
  routeDescription,
  routeDirection,
  routeOrigin,
  shape,
  onClose,
  center,
  zoom,
}: DiversionPanelProps & {
  shape: Shape
  onClose?: () => void
  center: LatLngLiteral
  zoom: number
}) => {
  const {
    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,
    directions,

    canUndo,
    undoLastWaypoint,
  } = useDetour()

  return (
    <article className="l-diversion-page h-100 border-box">
      <header className="l-diversion-page__header text-bg-light border-bottom">
        <CloseButton className="p-4" onClick={onClose} />
      </header>
      <div className="l-diversion-page__panel bg-light">
        <DiversionPanel
          directions={directions}
          missedStops={missedStops}
          routeName={routeName}
          routeDescription={routeDescription}
          routeOrigin={routeOrigin}
          routeDirection={routeDirection}
        />
      </div>
      <div className="l-diversion-page__map">
        <DetourMap
          originalShape={shape.points}
          detourShape={detourShape}
          startPoint={startPoint ?? undefined}
          endPoint={endPoint ?? undefined}
          waypoints={waypoints}
          onClickMap={addWaypoint}
          onClickOriginalShape={addConnectionPoint}
          undoDisabled={canUndo === false}
          onUndoLastWaypoint={undoLastWaypoint}
          center={center}
          zoom={zoom}
        />
      </div>
    </article>
  )
}
