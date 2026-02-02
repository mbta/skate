import React from "react"
import { Stop } from "../../schedule"
import {
  Badge,
  Button,
  ListGroup,
  OverlayTrigger,
  Popover,
} from "react-bootstrap"
import { uniqBy } from "../../helpers/array"
import { RoutePill } from "../routePill"
import { Files, ExclamationDiamond } from "../../helpers/bsIcons"
import { supportLinkUrl } from "../../navLinkData"

interface ConnectionPointsProps {
  connectionPoints: [string, string]
}

export const ConnectionPoints = ({
  connectionPoints: [connectionPointStart, connectionPointEnd],
}: ConnectionPointsProps) => (
  <section className="mb-4">
    <h2 className="c-diversion-panel__section-header">Connection Points</h2>
    <ListGroup as="ul">
      <ListGroup.Item>{connectionPointStart}</ListGroup.Item>
      <ListGroup.Item>{connectionPointEnd}</ListGroup.Item>
    </ListGroup>
  </section>
)

interface MissedStopsProps {
  missedStops: Stop[]
}

export const MissedStops = ({ missedStops }: MissedStopsProps) => (
  <section className="mb-4">
    <h2 className="c-diversion-panel__section-header">
      Missed Stops
      <Badge pill bg="missed-stop" className="ms-2 fs-4">
        {missedStops.length}
      </Badge>
    </h2>
    <ListGroup as="ul">
      {uniqBy(missedStops, (stop) => stop.id).map((missedStop) => (
        <ListGroup.Item key={missedStop.id}>{missedStop.name}</ListGroup.Item>
      ))}
    </ListGroup>
  </section>
)

interface AffectedRouteProps {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
}

export const AffectedRoute = ({
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
}: AffectedRouteProps) => (
  <section className="mt-2">
    <h2 className="c-diversion-panel__section-header c-detour-panel__subheader">
      Affected route
    </h2>
    <div className="d-flex">
      <RoutePill className="me-2 align-top" routeName={routeName} />

      <div className="d-inline-block">
        <p className="my-0 c-diversion-panel__description">
          {routeDescription}
        </p>
        <p className="my-1 text-muted c-diversion-panel__origin">
          {routeOrigin}
        </p>
        <p className="my-1 small c-diversion-panel__direction">
          {routeDirection}
        </p>
      </div>
    </div>
  </section>
)

export const CopyButton = ({ detourText }: { detourText: string }) => (
  <OverlayTrigger
    placement="bottom"
    trigger="click"
    rootClose
    rootCloseEvent="mousedown"
    overlay={
      <Popover>
        <Popover.Body>Copied to clipboard!</Popover.Body>
      </Popover>
    }
  >
    <Button
      className="icon-link"
      variant="outline-primary"
      size="sm"
      onClick={() => window.navigator.clipboard?.writeText(detourText)}
      data-fs-element="Copy Details"
    >
      <Files />
      Copy
    </Button>
  </OverlayTrigger>
)

export const IssueButton = () => (
  <Button
    className="m-3 mb-0 flex-grow-1 icon-link c-diversion-panel__issue-button"
    href={supportLinkUrl}
    variant="warning-light"
    target="_blank"
    rel="noreferrer"
    data-fs-element="Report An Issue - Detours"
  >
    <ExclamationDiamond />
    Report an issue
  </Button>
)
