import React from "react"
import { DetourShape } from "../../../models/detour"
import { Button, ListGroup } from "react-bootstrap"
import { Panel } from "../diversionPage"
import { Stop } from "../../../schedule"
import { ArrowLeft, CardChecklist } from "../../../helpers/bsIcons"
import { AffectedRoute, MissedStops } from "../detourPanelComponents"

export interface DrawDetourPanelProps {
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

export const DrawDetourPanel = ({
  directions,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  detourFinished,
  onReviewDetour,
  onChangeRoute,
}: DrawDetourPanelProps) => (
  <Panel as="article" className="c-diversion-panel">
    <Panel.Header>
      <h1 className="c-diversion-panel__h1 my-3">Draw Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
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

        <AffectedRoute
          routeName={routeName}
          routeDescription={routeDescription}
          routeOrigin={routeOrigin}
          routeDirection={routeDirection}
        />

        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Detour Directions</h2>
          {directions ? (
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
          ) : (
            <DirectionsHelpText />
          )}
        </section>

        <MissedStops missedStops={missedStops} />
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer hidden={!detourFinished}>
        <Button
          className="flex-grow-1 m-3 icon-link justify-content-center"
          onClick={onReviewDetour}
          data-fs-element="Review"
        >
          <CardChecklist />
          Review
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
