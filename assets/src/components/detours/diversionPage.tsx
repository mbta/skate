import React from "react"
import { DiversionPanel, DiversionPanelProps } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { Shape } from "../../schedule"
import { useDetour } from "../../hooks/useDetour"

export const DiversionPage = ({
  directions,
  missedStops,
  routeName,
  routeDescription,
  routeDirection,
  routeOrigin,
  shape,
}: DiversionPanelProps & { shape: Shape }) => {
  const {
    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,

    canUndo,
    undoLastWaypoint,
  } = useDetour()

  return (
    <article className="l-diversion-page h-100 border-box">
      <header className="l-diversion-page__header text-bg-light border-bottom">
        <h1 className="h3 text-center">Create Detour</h1>
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
        />
      </div>
    </article>
  )
}
