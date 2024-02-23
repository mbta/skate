import React, { ReactNode } from "react"
import { DiversionPanel } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { useDetour } from "../../hooks/useDetour"
import { CloseButton } from "react-bootstrap"
import { OriginalRoute } from "../../models/detour"

interface DiversionPageProps {
  missedStops?: ReactNode
  originalRoute: OriginalRoute
  onClose?: () => void
}

export const DiversionPage = ({
  missedStops,
  originalRoute,
  onClose,
}: DiversionPageProps) => {
  const {
    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,
    directions,

    canUndo,
    undo,
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
          routeName={originalRoute.routeName}
          routeDescription={originalRoute.routeDescription}
          routeOrigin={originalRoute.routeOrigin}
          routeDirection={originalRoute.routeDirection}
        />
      </div>
      <div className="l-diversion-page__map">
        <DetourMap
          originalShape={originalRoute.shape.points}
          center={originalRoute.center}
          zoom={originalRoute.zoom}
          detourShape={detourShape}
          startPoint={startPoint ?? undefined}
          endPoint={endPoint ?? undefined}
          waypoints={waypoints}
          onClickMap={addWaypoint}
          onClickOriginalShape={addConnectionPoint}
          undoDisabled={canUndo === false}
          onUndoLastWaypoint={undo}
        />
      </div>
    </article>
  )
}
