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
import { Files } from "../../helpers/bsIcons"

interface MissedStopsProps {
  missedStops?: Stop[]
}

export const MissedStops = ({ missedStops }: MissedStopsProps) => (
  <>
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
  </>
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
  <section className="pb-3">
    <h2 className="c-diversion-panel__h2 c-detour-panel__subheader">
      Affected route
    </h2>
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
      className="c-diversion-panel__outline-button c-diversion-panel__outline-button--copy icon-link"
      variant="outline-primary"
      onClick={() => window.navigator.clipboard?.writeText(detourText)}
    >
      <Files />
      Copy Details
    </Button>
  </OverlayTrigger>
)
