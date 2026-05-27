import React, { PropsWithChildren, useState } from "react"
import { Button, Form } from "react-bootstrap"
import { TypedDetour } from "../../../models/detour"
import { Panel } from "../diversionPage"
import { ArrowLeft, Power, Trash } from "../../../helpers/bsIcons"
import { AffectedRoute } from "../detourPanelComponents"

export interface TypeDetourPanelProps extends PropsWithChildren {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  typedDetour: TypedDetour
  onBack: () => void
  onSubmitDetour?: () => void
  onDeleteDetour?: () => void
  onChangeTypedDetour: (typedDetour: Partial<TypedDetour>) => void
  isActiveDetour: boolean
}

export const TypeDetourPanel = ({
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  typedDetour,
  onBack,
  onSubmitDetour,
  onDeleteDetour,
  isActiveDetour,
  onChangeTypedDetour,
  children,
}: TypeDetourPanelProps) => {
  const [validated, setValidated] = useState(false)

  const onSubmit = (e) => {
    const form = e.currentTarget
    if (form.checkValidity() === false) {
      e.preventDefault()
      e.stopPropagation()
    }

    setValidated(true)
  }

  return (
    <Panel as="article" className="c-diversion-panel">
      <Panel.Header className={isActiveDetour ? "active-detour" : ""}>
        <h1 className="c-diversion-panel__h1 my-3">
          {isActiveDetour ? "Edit Active Detour" : "Type Detour"}
        </h1>
      </Panel.Header>
      <Panel.Body className="d-flex flex-column">
        <Panel.Body.ScrollArea>
          <Button
            variant="outline-primary"
            className="align-self-start icon-link my-3"
            onClick={onBack}
            size="sm"
          >
            <ArrowLeft />
            Back
          </Button>

          <AffectedRoute
            routeName={routeName}
            routeDescription={routeDescription}
            routeOrigin={routeOrigin}
            routeDirection={routeDirection}
          />

          <section className="my-4">
            <Form
              id="type-detour-form"
              noValidate
              validated={validated}
              onSubmit={onSubmit}
            >
              <p className="fst-italic">
                Enter detour details below.
                <br />
                Directions are required
              </p>
              <Form.Group className="my-4">
                <Form.Label
                  htmlFor="form-directions"
                  className="d-block mb-3 c-diversion-panel__section-header"
                >
                  Directions
                </Form.Label>
                <Form.Control
                  as="textarea"
                  defaultValue={typedDetour.directions}
                  onChange={({ target: { value } }) =>
                    onChangeTypedDetour({ directions: value })
                  }
                  data-fs-element="Direction Text"
                  required
                  maxLength={5000}
                  id="form-directions"
                  aria-describedby="form-directions-character-count form-directions-feedback"
                />
                <Form.Control.Feedback id="form-directions-feedback" type="invalid">
                  Directions are required
                </Form.Control.Feedback>
                <Form.Text
                  muted
                  className="d-block text-end"
                  id="form-directions-character-count"
                >
                  {typedDetour.directions.length}/5000
                </Form.Text>
              </Form.Group>
              <Form.Group className="my-4">
                <Form.Label
                  htmlFor="form-connection-points"
                  className="d-block mb-3 c-diversion-panel__section-header"
                >
                  Connection Points{" "}
                  <span className="fw-normal">(optional)</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  defaultValue={typedDetour.connectionPoints}
                  onChange={({ target: { value } }) =>
                    onChangeTypedDetour({ connectionPoints: value })
                  }
                  data-fs-element="Connection Point Text"
                  maxLength={1000}
                  id="form-connection-points"
                  aria-describedby="form-connection-points-character-count"
                />
                <Form.Text
                  muted
                  className="d-block text-end"
                  id="form-connection-points-character-count"
                >
                  {typedDetour.connectionPoints.length}/1000
                </Form.Text>
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
                  defaultValue={typedDetour.missedStops}
                  onChange={({ target: { value } }) =>
                    onChangeTypedDetour({ missedStops: value })
                  }
                  data-fs-element="Missed Stops Text"
                  maxLength={1000}
                  id="form-missed-stops"
                  aria-describedby="form-missed-stops-character-count"
                />
                <Form.Text
                  muted
                  className="d-block text-end"
                  id="form-missed-stops-character-count"
                >
                  {typedDetour.missedStops.length}/1000
                </Form.Text>
              </Form.Group>
            </Form>
          </section>
        </Panel.Body.ScrollArea>

        <Panel.Body.Footer className="d-flex flex-column">
          {onDeleteDetour && (
            <Button
              className="m-3 mb-0 flex-grow-1 icon-link c-diversion-panel__deletion-button"
              variant="outline-danger"
              onClick={onDeleteDetour}
              data-fs-element="Delete Detour Draft"
              title="Delete Draft"
            >
              <Trash />
              Delete draft
            </Button>
          )}
          <Button
            className="flex-grow-1 m-3 icon-link"
            data-fs-element="Submit Typed Detour"
            form="type-detour-form"
            type="submit"
          >
            <Power />
            {isActiveDetour ? "Publish Detour Edits" : "Start detour"}
          </Button>
        </Panel.Body.Footer>
      </Panel.Body>
      {children}
    </Panel>
  )
}
