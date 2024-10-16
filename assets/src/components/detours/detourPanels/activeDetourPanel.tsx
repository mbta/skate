import React, { PropsWithChildren } from "react"
import { DetourDirection } from "../../../models/detour"
import { Button, ListGroup } from "react-bootstrap"
import { Panel } from "../diversionPage"
import { Stop } from "../../../schedule"
import {
  ArrowLeft,
  ExclamationTriangleFill,
  StopCircle,
} from "../../../helpers/bsIcons"
import { AffectedRoute, MissedStops } from "../detourPanelComponents"

export interface ActiveDetourPanelProps extends PropsWithChildren {
  directions?: DetourDirection[]
  connectionPoints?: string[]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  onOpenDeactivateModal?: () => void
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
  onOpenDeactivateModal,
  onNavigateBack,
  children,
}: ActiveDetourPanelProps) => {
  const backButton = (
    <Button
      className="c-diversion-panel__back-button icon-link my-3"
      variant="outline-primary"
      onClick={onNavigateBack}
    >
      <ArrowLeft />
      Back
    </Button>
  )

  return (
    <Panel as="article" className="c-diversion-panel">
      <Panel.Header className="d-inline-flex justify-content-between">
        <h1 className="c-diversion-panel__header_text c-diversion-panel__h1 my-3">
          Active Detour
        </h1>
        {backButton}
      </Panel.Header>

      <Panel.Body className="d-flex flex-column">
        <Panel.Body.ScrollArea>
          <div className="d-flex c-diversion-panel__back-button-container justify-content-between align-items-center">
            {backButton}
            <ExclamationTriangleFill className="c-active-detour__alert-icon" />
          </div>
          <AffectedRoute
            routeName={routeName}
            routeDescription={routeDescription}
            routeOrigin={routeOrigin}
            routeDirection={routeDirection}
          />

          {connectionPoints && (
            <section className="pb-3">
              <h2 className="c-diversion-panel__h2">Connection Points</h2>
              <ListGroup as="ul">
                <ListGroup.Item>{connectionPoints[0]}</ListGroup.Item>
                <ListGroup.Item>{connectionPoints[1]}</ListGroup.Item>
              </ListGroup>
            </section>
          )}

          <MissedStops missedStops={missedStops} />

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
            ) : null}
          </section>
        </Panel.Body.ScrollArea>

        <Panel.Body.Footer>
          {onOpenDeactivateModal && (
            <Button
              variant="ui-alert"
              className="flex-grow-1 m-3 icon-link text-light justify-content-center"
              onClick={onOpenDeactivateModal}
            >
              <StopCircle />
              Return to regular route
            </Button>
          )}
        </Panel.Body.Footer>
      </Panel.Body>
      {children}
    </Panel>
  )
}
