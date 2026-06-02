import React, { PropsWithChildren } from "react"
import { Button } from "react-bootstrap"
import { TypedDetour } from "../../../models/detour"
import { Panel } from "../diversionPage"
import { ArrowLeft, Power, Trash } from "../../../helpers/bsIcons"
import { AffectedRoute, TypeDetourForm } from "../detourPanelComponents"

export interface TypeDetourPanelProps extends PropsWithChildren {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  typedDetour: TypedDetour
  onBack: () => void
  onSubmitDetour: () => void
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

          <TypeDetourForm
            typedDetour={typedDetour}
            onChangeTypedDetour={onChangeTypedDetour}
            onSubmitDetour={onSubmitDetour}
          />
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
