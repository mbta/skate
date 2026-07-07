import React, { useState } from "react"
import { DetourDirection, TypedDetour } from "../../models/detour"
import { Stop } from "../../schedule"
import {
  Badge,
  Button,
  Form,
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
  children?: React.ReactElement
}

export const Directions = ({
  directions,
  helperText,
  children,
}: DirectionsProps) => {
  const renderBody = () => {
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
      {children ?? renderBody()}
    </section>
  )
}

interface ConnectionPointsProps {
  connectionPoints?: [string, string]
}

export const ConnectionPoints = ({
  connectionPoints,
}: ConnectionPointsProps) => (
  <section className="mb-4">
    <h2 className="c-diversion-panel__section-header">Connection Points</h2>

    {connectionPoints && (
      <ListGroup as="ul">
        <ListGroup.Item>{connectionPoints[0]}</ListGroup.Item>
        <ListGroup.Item>{connectionPoints[1]}</ListGroup.Item>
      </ListGroup>
    )}
  </section>
)

interface MissedStopsProps {
  missedStops?: Stop[]
}

export const MissedStops = ({ missedStops }: MissedStopsProps) => (
  <section className="mb-4">
    <h2 className="c-diversion-panel__section-header">
      Missed Stops
      {missedStops && (
        <Badge pill bg="missed-stop" className="ms-2 fs-4">
          {missedStops.length}
        </Badge>
      )}
    </h2>
    {missedStops && (
      <ListGroup as="ul">
        {uniqBy(missedStops, (stop) => stop.id).map((missedStop) => (
          <ListGroup.Item key={missedStop.id}>{missedStop.name}</ListGroup.Item>
        ))}
      </ListGroup>
    )}
  </section>
)

interface TypedDetourFormProps {
  typedDetour: TypedDetour
  onChangeTypedDetour?: (typedDetour: Partial<TypedDetour>) => void
  onSubmitDetour?: () => void
}

export const TypeDetourForm = ({
  typedDetour,
  onChangeTypedDetour,
  onSubmitDetour,
}: TypedDetourFormProps) => {
  const [validated, setValidated] = useState(false)
  const isReadOnly = onSubmitDetour === undefined

  const onSubmit = (e: React.SyntheticEvent) => {
    if (!onSubmitDetour) return

    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement

    if (form.checkValidity() === true) {
      onSubmitDetour()
    }
    setValidated(true)
  }

  const defaultValue = (value: string): string => {
    if (isReadOnly && !value) return "—"

    return value
  }

  return (
    <section className="my-4">
      <Form
        id="type-detour-form"
        noValidate
        validated={validated}
        onSubmit={onSubmit}
      >
        {!isReadOnly && (
          <p className="fst-italic">
            Enter detour details below.
            <br />
            Directions are required
          </p>
        )}

        <Form.Group className="my-4">
          <Form.Label
            htmlFor="form-directions"
            className="d-block mb-3 c-diversion-panel__section-header"
          >
            Directions
          </Form.Label>
          <Form.Control
            as="textarea"
            defaultValue={defaultValue(typedDetour.directions)}
            onChange={({ target: { value } }) =>
              onChangeTypedDetour && onChangeTypedDetour({ directions: value })
            }
            data-fs-element="Direction Text"
            required
            maxLength={5000}
            id="form-directions"
            aria-describedby="form-directions-character-count form-directions-feedback"
            readOnly={isReadOnly}
          />
          <Form.Control.Feedback id="form-directions-feedback" type="invalid">
            Directions are required
          </Form.Control.Feedback>
          {!isReadOnly && (
            <Form.Text
              muted
              className="d-block text-end"
              id="form-directions-character-count"
            >
              {typedDetour.directions.length}/5000
            </Form.Text>
          )}
        </Form.Group>
        <Form.Group className="my-4">
          <Form.Label
            htmlFor="form-connection-points"
            className="d-block mb-3 c-diversion-panel__section-header"
          >
            Connection Points <span className="fw-normal">(optional)</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            defaultValue={defaultValue(typedDetour.connectionPoints)}
            onChange={({ target: { value } }) =>
              onChangeTypedDetour &&
              onChangeTypedDetour({ connectionPoints: value })
            }
            data-fs-element="Connection Point Text"
            maxLength={1000}
            id="form-connection-points"
            aria-describedby="form-connection-points-character-count"
            readOnly={isReadOnly}
          />
          {!isReadOnly && (
            <Form.Text
              muted
              className="d-block text-end"
              id="form-connection-points-character-count"
            >
              {typedDetour.connectionPoints.length}/1000
            </Form.Text>
          )}
        </Form.Group>
        <Form.Group>
          <Form.Label
            htmlFor="form-missed-stops"
            className="d-block mb-3 c-diversion-panel__section-header"
          >
            Missed Stops <span className="fw-normal">(optional)</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            defaultValue={defaultValue(typedDetour.missedStops)}
            onChange={({ target: { value } }) =>
              onChangeTypedDetour && onChangeTypedDetour({ missedStops: value })
            }
            data-fs-element="Missed Stops Text"
            maxLength={1000}
            id="form-missed-stops"
            aria-describedby="form-missed-stops-character-count"
            readOnly={isReadOnly}
          />
          {!isReadOnly && (
            <Form.Text
              muted
              className="d-block text-end"
              id="form-missed-stops-character-count"
            >
              {typedDetour.missedStops.length}/1000
            </Form.Text>
          )}
        </Form.Group>
      </Form>
    </section>
  )
}

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
