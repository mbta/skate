import React, { ReactNode } from "react"
import { RoutePill } from "../routePill"

export interface DiversionPanelProps {
  directions?: ReactNode
  missedStops?: ReactNode
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
}

export const DiversionPanel = ({
  directions,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
}: DiversionPanelProps) => (
  <article className="c-diversion-panel h-100 bg-light border-end">
    <header className="c-diversion-panel__header align-items-center border-bottom d-flex justify-content-around px-3">
      <h2 className="h6 m-0">Detour Details</h2>
    </header>

    <div className="c-diversion-panel__body overflow-auto px-3">
      <section className="py-3 border-bottom">
        <h3 className="h4">Affected route</h3>

        <div className="d-flex gap-2">
          <RoutePill routeName={routeName} />

          <div>
            <p className="my-0">{routeDescription}</p>
            <p className="my-0">{routeOrigin}</p>
            <p className="my-0">{routeDirection}</p>
          </div>
        </div>
      </section>

      <section className="py-3">
        <h3 className="h4">Detour Directions</h3>
        {directions || <DirectionsHelpText />}
      </section>

      {missedStops && (
        <section className="py-3">
          <h3 className="h4">Missed Stops</h3>
          {missedStops}
        </section>
      )}
    </div>
  </article>
)

const DirectionsHelpText = () => (
  <p>
    <i>
      Click a point on the regular route to start drawing your detour. As you
      continue to select points on the map, turn-by-turn directions will appear
      in this drawer.
    </i>
  </p>
)
