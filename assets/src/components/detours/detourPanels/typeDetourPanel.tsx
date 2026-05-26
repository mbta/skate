import React, { PropsWithChildren } from "react"
import { Button, Form } from "react-bootstrap"
import { TypedDetour } from "../../../models/detour"
import { Panel } from "../diversionPage"
import { ArrowLeft, CardChecklist, Trash } from "../../../helpers/bsIcons"
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
            <p className="fst-italic">
              Enter detour details below.
              <br />
              Directions are required
            </p>
            <label>
              <h2 className="c-diversion-panel__section-header">Directions</h2>
            </label>
            <Form.Control
              as="textarea"
              defaultValue={typedDetour.directions}
              onChange={({ target: { value } }) =>
                onChangeTypedDetour({ directions: value })
              }
              data-fs-element="Direction Text"
              maxLength={5000}
            />
            <Form.Text muted>{typedDetour.directions.length}/5000</Form.Text>
            <label>
              <h2 className="c-diversion-panel__section-header">
                Connection Points <span className="fw-normal">(optional)</span>
              </h2>
            </label>
            <Form.Control
              as="textarea"
              defaultValue={typedDetour.connectionPoints}
              onChange={({ target: { value } }) =>
                onChangeTypedDetour({ connectionPoints: value })
              }
              data-fs-element="Connection Point Text"
              maxLength={1000}
            />
            <Form.Text muted>
              {typedDetour.connectionPoints.length}/1000
            </Form.Text>
            <label>
              <h2 className="c-diversion-panel__section-header">
                Missed Stops <span className="fw-normal">(optional)</span>
              </h2>
            </label>
            <Form.Control
              as="textarea"
              defaultValue={typedDetour.missedStops}
              onChange={({ target: { value } }) =>
                onChangeTypedDetour({ missedStops: value })
              }
              data-fs-element="Missed Stops Text"
              maxLength={1000}
            />
            <Form.Text muted>{typedDetour.missedStops.length}/1000</Form.Text>
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
            onClick={onSubmitDetour}
            data-fs-element="Submit Typed Detour"
          >
            <CardChecklist />
            {isActiveDetour ? "Publish Detour Edits" : "Start detour"}
          </Button>
        </Panel.Body.Footer>
      </Panel.Body>
      {children}
    </Panel>
  )
}
