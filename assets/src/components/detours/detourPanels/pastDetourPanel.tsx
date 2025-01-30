import React from "react"
import { Panel } from "../diversionPage"
import { DetourDirection } from "../../../models/detour"
import { Stop } from "../../../schedule"
import { ArrowLeft } from "../../../helpers/bsIcons"
import { Button, ListGroup } from "react-bootstrap"
import {
  AffectedRoute,
  ConnectionPoints,
  CopyButton,
  MissedStops,
} from "../detourPanelComponents"
import inTestGroup, { TestGroups } from "../../../userInTestGroup"

export interface PastDetourPanelProps {
  copyableDetourText: string
  directions?: DetourDirection[]
  connectionPoints: [string, string]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  onNavigateBack: () => void
}

export const PastDetourPanel = ({
  copyableDetourText,
  directions,
  connectionPoints,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  onNavigateBack,
}: PastDetourPanelProps) => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">View Past Detour</h1>
      {/* TODO: temporary test group until I get the copy logic hooked up */}
      {inTestGroup(TestGroups.CopyButton) && (
        <CopyButton detourText={copyableDetourText} />
      )}
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      <Panel.Body.ScrollArea>
        <div className="d-flex justify-content-between align-items-center">
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
        </div>
        <AffectedRoute
          routeName={routeName}
          routeDescription={routeDescription}
          routeOrigin={routeOrigin}
          routeDirection={routeDirection}
        />

        <section className="my-4">
          <h2 className="c-diversion-panel__section-header">
            Detour Directions
          </h2>
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

        {connectionPoints && (
          <ConnectionPoints connectionPoints={connectionPoints} />
        )}

        {missedStops && <MissedStops missedStops={missedStops} />}
      </Panel.Body.ScrollArea>
    </Panel.Body>
  </Panel>
)
