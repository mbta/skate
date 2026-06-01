import React from "react"
import { DetourDirection } from "../../models/detour"
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

interface DirectionsProps {
  directions?: DetourDirection[]
  typedDirections?: string
  helperText?: React.ReactElement
  editForm?: React.ReactElement
}

export const Directions = ({
  directions,
  typedDirections,
  helperText,
  editForm,
}: DirectionsProps) => {
  const Body = () => {
    if (typedDirections) return <p>{typedDirections}</p> // placeholder
    if (editForm) return editForm
    if (directions)
      return (
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
      )
    return helperText
  }

  return (
    <section className="my-4">
      <h2 className="c-diversion-panel__section-header">Detour Directions</h2>
      <Body />
    </section>
  )
}

interface ConnectionPointsProps {
  connectionPoints?: [string, string]
  typedConnectionPoints?: string
}

export const ConnectionPoints = ({
  connectionPoints,
  typedConnectionPoints,
}: ConnectionPointsProps) => (
  <section className="mb-4">
    <h2 className="c-diversion-panel__section-header">Connection Points</h2>

    {typedConnectionPoints ? (
      <p>{typedConnectionPoints}</p> // placeholder
    ) : (
      connectionPoints && (
        <ListGroup as="ul">
          <ListGroup.Item>{connectionPoints[0]}</ListGroup.Item>
          <ListGroup.Item>{connectionPoints[1]}</ListGroup.Item>
        </ListGroup>
      )
    )}
  </section>
)

interface MissedStopsProps {
  missedStops?: Stop[]
  typedMissedStops?: string
}

export const MissedStops = ({
  missedStops,
  typedMissedStops,
}: MissedStopsProps) => (
  <section className="mb-4">
    <h2 className="c-diversion-panel__section-header">
      Missed Stops
      {missedStops && (
        <Badge pill bg="missed-stop" className="ms-2 fs-4">
          {missedStops.length}
        </Badge>
      )}
    </h2>
    {typedMissedStops ? (
      <p>{typedMissedStops}</p> // placeholder
    ) : (
      missedStops && (
        <ListGroup as="ul">
          {uniqBy(missedStops, (stop) => stop.id).map((missedStop) => (
            <ListGroup.Item key={missedStop.id}>
              {missedStop.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )
    )}
  </section>
)

interface AffectedRouteProps {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  displayTitle?: boolean
}

export const AffectedRoute = ({
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  displayTitle = true,
}: AffectedRouteProps) => (
  <section className="mt-2">
    {displayTitle && (
      <h2 className="c-diversion-panel__section-header c-detour-panel__subheader">
        Affected route
      </h2>
    )}
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

// text detour form ?

// text only alert

//
