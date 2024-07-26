import React from "react"
import { RoutePill } from "../routePill"
import { DetourShape } from "../../models/detour"
import { Badge, Button, ListGroup } from "react-bootstrap"
import { Panel } from "./diversionPage"
import { Stop } from "../../schedule"
import { uniqBy } from "../../helpers/array"
import { ArrowLeft } from "../../helpers/bsIcons"

export interface DiversionPanelProps {
  directions?: DetourShape["directions"]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  detourFinished?: boolean
  onReviewDetour?: () => void
  onChangeRoute: () => void
}

export const DiversionPanel = ({
  directions,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  detourFinished,
  onReviewDetour,
  onChangeRoute,
}: DiversionPanelProps) => (
  <Panel as="article" className="c-diversion-panel">
    <Panel.Header>
      <h1 className="c-diversion-panel__h1 my-3">Create Detour</h1>
    </Panel.Header>

    <Panel.Body className="c-diversion-panel__body d-flex flex-column">
      <Panel.Body.ScrollArea>
        {onChangeRoute && (
          <Button
            className="icon-link my-3"
            variant="outline-primary"
            onClick={onChangeRoute}
          >
            <ArrowLeft />
            Change route or direction
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

        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Detour Directions</h2>
          {directions ? (
            <ListGroup as="ol">
              {directions.map((d, index) => (
                <ListGroup.Item key={index + d.instruction} as="li">
                  {d.instruction == "Regular Route" ? (
                    <strong className="fw-medium">{d.instruction}</strong>
                  ) : (
                    d.instruction
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <DirectionsHelpText />
          )}
        </section>

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
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer hidden={!detourFinished}>
        <Button className="flex-grow-1 m-3" onClick={onReviewDetour}>
          Review Detour
        </Button>
      </Panel.Body.Footer>
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
