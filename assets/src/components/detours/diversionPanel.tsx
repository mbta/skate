import React, { ReactNode } from "react"
import { RoutePill } from "../routePill"
import { DetourShape } from "../../models/detour"
import { ListGroup } from "react-bootstrap"
import { Panel } from "./diversionPage"

export interface DiversionPanelProps {
  directions?: DetourShape["directions"]
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
  <Panel as="article" className="c-diversion-panel">
    <Panel.Header>
      <h1 className="c-diversion-panel__h2 my-3">Create Detour</h1>
    </Panel.Header>

    <Panel.Body className="c-diversion-panel__body overflow-auto px-3">
      <section className="pb-3 border-bottom">
        <h2 className="c-diversion-panel__h3">Affected route</h2>

        <div className="d-flex">
          <RoutePill
            className="d-inline-block me-2 align-top"
            routeName={routeName}
          />

          <div className="d-inline-block">
            <p className="my-0 c-diversion-panel__description">
              {routeDescription}
            </p>
            <p className="my-0 text-muted c-diversion-panel__origin py-1">
              {routeOrigin}
            </p>
            <p className="my-0 small c-diversion-panel__direction py-1">
              {routeDirection}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-3">
        <h2 className="c-diversion-panel__h3">Detour Directions</h2>
        {directions ? (
          <ListGroup as="ol">
            {directions.map((d) => (
              <ListGroup.Item key={d.instruction} as="li">
                {d.instruction}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <DirectionsHelpText />
        )}
      </section>

      {missedStops && (
        <section className="pb-3">
          <h2 className="c-diversion-panel__h3">Missed Stops</h2>
          {missedStops}
        </section>
      )}
    </Panel.Body>
  </Panel>
)

const DirectionsHelpText = () => (
  <p className="c-diversion-panel__help-text">
    <i>
      Click a point on the regular route to start drawing your detour. As you
      continue to select points on the map, turn-by-turn directions will appear
      in this panel.
    </i>
  </p>
)
