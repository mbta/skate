import React from "react"
import { RoutePill } from "../routePill"
import { DetourDirection } from "../../models/detour"
import { Badge, Button, ListGroup } from "react-bootstrap"
import { Panel } from "./diversionPage"
import { Stop } from "../../schedule"
import { uniqBy } from "../../helpers/array"
import { ArrowLeft } from "../../helpers/bsIcons"

export interface ActiveDetourPanelProps {
  directions: DetourDirection[]
  connectionPoints?: string[]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  onDeactivateDetour?: () => void
  onNavigateBack: () => void
}

export const ActiveDetourPanel = ({
  directions,
  connectionPoints,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  onDeactivateDetour,
  onNavigateBack,
}: ActiveDetourPanelProps) => (
  <Panel as="article" className="c-diversion-panel">
    <Panel.Header>
      <h1 className="c-diversion-panel__h1 my-3">Active Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      <Panel.Body.ScrollArea>
        {onNavigateBack && (
          <Button
            className="icon-link my-3"
            variant="outline-primary"
            onClick={onNavigateBack}
          >
            <ArrowLeft />
            Back
          </Button>
        )}

        <section className="pb-3 border-bottom">
          <h2 className="c-diversion-panel__h2">Affected route</h2>
          <div className="d-flex">
            <RoutePill className="me-2 align-top" routeName={routeName} />

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

        {connectionPoints && (
          <section className="pb-3">
            <h2 className="c-diversion-panel__h2">Connection Points</h2>
            <ListGroup as="ul">
              {connectionPoints.map((point) => (
                <ListGroup.Item key={point}>{point}</ListGroup.Item>
              ))}
            </ListGroup>
          </section>
        )}

        {missedStops && (
          <section className="pb-3">
            <h2 className="c-diversion-panel__h2">
              Missed Stops <Badge bg="missed-stop">{missedStops.length}</Badge>
            </h2>
            <ListGroup as="ul">
              {uniqBy(missedStops, (stop) => stop.id).map((missedStop) => (
                <ListGroup.Item key={missedStop.id}>
                  {missedStop.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </section>
        )}

        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Detour Directions</h2>
          <ListGroup as="ol">
            {directions.map((d) => (
              <ListGroup.Item key={d.instruction} as="li">
                {d.instruction == "Regular Route" ? (
                  <strong className="fw-medium">{d.instruction}</strong>
                ) : (
                  d.instruction
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </section>
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer>
        <Button className="flex-grow-1 m-3" onClick={onDeactivateDetour}>
          Return to Regular Route
        </Button>
      </Panel.Body.Footer>
    </Panel.Body>
  </Panel>
)
