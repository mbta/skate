import React, { PropsWithChildren } from "react"
import { DetourShape } from "../../../models/detour"
import { Button, ListGroup } from "react-bootstrap"
import * as BsIcons from "../../../helpers/bsIcons"
import { Panel } from "../diversionPage"
import { Stop } from "../../../schedule"
import { ArrowLeft, CardChecklist } from "../../../helpers/bsIcons"
import {
  AffectedRoute,
  ConnectionPoints,
  MissedStops,
  IssueButton,
} from "../detourPanelComponents"

export interface DrawDetourPanelProps extends PropsWithChildren {
  directions?: DetourShape["directions"]
  connectionPoints?: [string, string]
  missedStops?: Stop[]
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  detourFinished?: boolean
  onReviewDetour?: () => void
  onDeleteDetour?: () => void
  onChangeRoute?: () => void
  onCancelEdit?: () => void
  isActiveDetour: boolean
}

export const DrawDetourPanel = ({
  directions,
  connectionPoints,
  missedStops,
  routeName,
  routeDescription,
  routeOrigin,
  routeDirection,
  detourFinished,
  onReviewDetour,
  onDeleteDetour,
  onChangeRoute,
  onCancelEdit,
  isActiveDetour,
  children,
}: DrawDetourPanelProps) => (
  <Panel as="article" className="c-diversion-panel">
    <Panel.Header className={isActiveDetour ? "active-detour" : ""}>
      <h1 className="c-diversion-panel__h1 my-3">
        {isActiveDetour ? "Edit Active Detour" : "Edit Detour"}
      </h1>
    </Panel.Header>
    <Panel.Body className="d-flex flex-column">
      <Panel.Body.ScrollArea>
        {onChangeRoute && (
          <Button
            className="icon-link my-3"
            variant="outline-primary"
            onClick={onChangeRoute}
          >
            <ArrowLeft />
            Change route or direction
          </Button>
        )}
        {isActiveDetour && (
          <Button
            variant="outline-primary"
            className="align-self-start icon-link my-3"
            onClick={onCancelEdit}
            size="sm"
          >
            <ArrowLeft />
            Cancel
          </Button>
        )}

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
          ) : (
            <DirectionsHelpText />
          )}
        </section>

        {connectionPoints && (
          <ConnectionPoints connectionPoints={connectionPoints} />
        )}

        {missedStops && <MissedStops missedStops={missedStops} />}
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer className="d-flex flex-column">
        <IssueButton />
        {onDeleteDetour && (
          <Button
            className="m-3 mb-0 flex-grow-1 icon-link c-diversion-panel__deletion-button"
            variant="outline-danger"
            onClick={onDeleteDetour}
            data-fs-element="Delete Detour Draft"
            title="Delete Draft"
          >
            <BsIcons.Trash />
            Delete draft
          </Button>
        )}
        <Button
          className="flex-grow-1 m-3 icon-link"
          onClick={onReviewDetour}
          data-fs-element="Review Drawn Detour"
          disabled={!detourFinished}
        >
          <CardChecklist />
          Review {isActiveDetour && " Changes"}
        </Button>
      </Panel.Body.Footer>
    </Panel.Body>
    {children}
  </Panel>
)

const DirectionsHelpText = () => (
  <p className="c-diversion-panel__help-text">
    <i>
      Click a point on the regular route to start drawing your detour. As you
      continue to select points on the map, turn-by-turn directions will appear
      in this panel.
    </i>
  </p>
)
