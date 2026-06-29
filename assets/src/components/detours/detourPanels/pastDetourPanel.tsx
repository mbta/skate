import React from "react"
import { Panel } from "../diversionPage"
import { DetourDirection } from "../../../models/detour"
import { Stop } from "../../../schedule"
import { ArrowLeft, Copy } from "../../../helpers/bsIcons"
import { Button } from "react-bootstrap"
import {
  Directions,
  AffectedRoute,
  ConnectionPoints,
  CopyButton,
  MissedStops,
  IssueButton,
} from "../detourPanelComponents"

export interface PastDetourPanelProps {
  copyableDetourText: string
  directions?: DetourDirection[]
  connectionPoints: [string, string]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  onCopyToDraftDetour: () => void
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
  onCopyToDraftDetour,
  onNavigateBack,
}: PastDetourPanelProps) => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">View Past Detour</h1>
      <CopyButton detourText={copyableDetourText} />
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

        <Directions directions={directions} />
        <ConnectionPoints connectionPoints={connectionPoints} />
        <MissedStops missedStops={missedStops} />
      </Panel.Body.ScrollArea>
      <Panel.Body.Footer className="d-flex flex-column">
        <IssueButton />
        <Button
          className="m-3 flex-grow-1 icon-link"
          variant="outline-primary"
          onClick={onCopyToDraftDetour}
          data-fs-element="Copy to new draft"
          title="Copy to new draft"
        >
          <Copy />
          Copy to new draft
        </Button>
      </Panel.Body.Footer>
    </Panel.Body>
  </Panel>
)
