import React, { PropsWithChildren, useId } from "react"
import { DetourDirection } from "../../../models/detour"
import { Button, ListGroup } from "react-bootstrap"
import { Panel } from "../diversionPage"
import { Stop } from "../../../schedule"
import {
  ArrowLeft,
  ClockHistory,
  Edit,
  ExclamationTriangleFill,
  StopCircle,
} from "../../../helpers/bsIcons"
import {
  AffectedRoute,
  ConnectionPoints,
  CopyButton,
  MissedStops,
  IssueButton,
} from "../detourPanelComponents"
import { timeAgoLabelFromDate } from "../../../util/dateTime"
import useCurrentTime from "../../../hooks/useCurrentTime"

export interface ActiveDetourPanelProps extends PropsWithChildren {
  copyableDetourText: string
  directions?: DetourDirection[]
  connectionPoints?: [string, string]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  showIssueButton: boolean
  onOpenDeactivateModal?: () => void
  onOpenChangeDurationModal?: () => void
  onNavigateBack: () => void
  onEditActiveDetour?: () => void

  detourReason: string
  detourDuration: string
  activatedAt: Date
}

export const ActiveDetourPanel = ({
  copyableDetourText,
  directions,
  connectionPoints,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  onOpenDeactivateModal,
  onOpenChangeDurationModal,
  onNavigateBack,
  onEditActiveDetour,
  children,
  activatedAt,
  detourDuration,
  detourReason,
  showIssueButton,
}: ActiveDetourPanelProps) => {
  const backButton = (
    <Button
      className="c-diversion-panel__back-button icon-link my-3"
      variant="outline-primary"
      size="sm"
      onClick={onNavigateBack}
    >
      <ArrowLeft />
      Back
    </Button>
  )

  const currentTime = useCurrentTime()

  const idSuffix = useId()
  const dlReasonId = "dl-reason" + idSuffix
  const dlActiveSinceId = "dl-active-since" + idSuffix
  const dlDurationId = "dl-duration" + idSuffix

  return (
    <Panel as="article" className="c-diversion-panel">
      <Panel.Header>
        <h1 className="c-diversion-panel__header_text c-diversion-panel__h1 my-3">
          Active Detour
        </h1>
        {backButton}
        <CopyButton detourText={copyableDetourText} />
      </Panel.Header>

      <Panel.Body className="d-flex flex-column">
        <Panel.Body.ScrollArea>
          <div className="d-flex c-diversion-panel__desktop-buttons justify-content-between align-items-center">
            {backButton}
            <ExclamationTriangleFill className="c-active-detour__alert-icon" />
          </div>
          <AffectedRoute
            routeName={routeName}
            routeDescription={routeDescription}
            routeOrigin={routeOrigin}
            routeDirection={routeDirection}
          />

          <dl className="l-inline-dl mt-2">
            <div>
              <dt id={dlReasonId} className="fw-bold me-2">
                Reason
              </dt>
              <dd aria-labelledby={dlReasonId}>{detourReason}</dd>
            </div>

            <div>
              <dt id={dlActiveSinceId} className="fw-bold me-2">
                On detour since
              </dt>
              <dd aria-labelledby={dlActiveSinceId}>
                {timeAgoLabelFromDate(activatedAt, currentTime)}
              </dd>
            </div>

            <div>
              <dt id={dlDurationId} className="fw-bold me-2">
                Est. Duration
              </dt>
              <dd aria-labelledby={dlDurationId}>{detourDuration}</dd>
            </div>
          </dl>

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

        <Panel.Body.Footer className="d-flex flex-column">
          {showIssueButton && <IssueButton />}
          {onEditActiveDetour && (
            <Button
              disabled={true} // Disabled for now
              className="m-3 mb-0 flex-grow-1 icon-link"
              variant="outline-primary"
              onClick={onEditActiveDetour}
              data-fs-element="Edit Route"
              title="Edit Route"
            >
              <Edit />
              Edit Route
            </Button>
          )}
          {onOpenChangeDurationModal && (
            <Button
              variant="outline-primary"
              className="flex-grow-1 m-3 mb-0 icon-link"
              onClick={onOpenChangeDurationModal}
              data-fs-element="Change duration"
            >
              <ClockHistory />
              Change duration
            </Button>
          )}
          {onOpenDeactivateModal && (
            <Button
              variant="danger"
              className="flex-grow-1 m-3 icon-link text-light"
              onClick={onOpenDeactivateModal}
              data-fs-element="Return to Regular Route"
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
