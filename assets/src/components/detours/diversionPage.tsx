import React from "react"
import { DiversionPanel, DiversionPanelProps } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { Shape } from "../../schedule"

export const DiversionPage = ({
  directions,
  missedStops,
  routeName,
  routeDescription,
  routeDirection,
  routeOrigin,
  shape,
}: DiversionPanelProps & { shape: Shape }) => (
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
      <DetourMap shape={shape} />
    </div>
  </article>
)
