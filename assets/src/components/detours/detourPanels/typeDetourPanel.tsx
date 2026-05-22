import React, { PropsWithChildren } from "react"
import { Button } from "react-bootstrap"
import { Panel } from "../diversionPage"
import { ArrowLeft, CardChecklist, Trash } from "../../../helpers/bsIcons"
import { AffectedRoute } from "../detourPanelComponents"

export interface TypeDetourPanelProps extends PropsWithChildren {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  onBack: () => void
  onSubmitDetour?: () => void
  onDeleteDetour?: () => void
  isActiveDetour: boolean
}

export const TypeDetourPanel = ({
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  onBack,
  onSubmitDetour,
  onDeleteDetour,
  isActiveDetour,
  children,
}: TypeDetourPanelProps) => (
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
          <h2 className="c-diversion-panel__section-header">
            Detour Directions
          </h2>
          {/* directions input */}
          {/* connection points input */}
          {/* missed stops input */}
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
