import React, { PropsWithChildren, ReactNode } from "react"
import { Button, Form } from "react-bootstrap"
import * as BsIcons from "../../../helpers/bsIcons"
import { Panel } from "../diversionPage"
import {
  ConnectionPoints,
  CopyButton,
  MissedStops,
} from "../detourPanelComponents"
import { Stop } from "../../../schedule"

interface DetourFinishedPanelProps extends PropsWithChildren {
  onNavigateBack: () => void
  copyableDetourText: string
  editableDirections: string
  connectionPoints?: [string, string]
  missedStops?: Stop[]
  onChangeDetourText: (value: string) => void
  onActivateDetour?: () => void
  onDeleteDetour?: () => void
  affectedRoute?: ReactNode
}

export const DetourFinishedPanel = ({
  onNavigateBack,
  copyableDetourText,
  editableDirections,
  connectionPoints,
  missedStops,
  onChangeDetourText,
  onActivateDetour,
  onDeleteDetour,
  children,
  affectedRoute,
}: DetourFinishedPanelProps) => (
  <Panel as="article" className="c-diversion-panel">
    <Panel.Header>
      <h1 className="c-diversion-panel__h1 my-3">View Draft Detour</h1>
      <CopyButton detourText={copyableDetourText} />
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      {/* The easiest way to make the `<textarea/>` fit the panel is to use flex */}
      <Panel.Body.ScrollArea className="d-flex flex-column">
        <Button
          className="align-self-start icon-link my-3"
          variant="outline-primary"
          onClick={onNavigateBack}
        >
          <BsIcons.ArrowLeft /> Edit
        </Button>

        {affectedRoute}

        <section className="mt-4">
          <h2 className="c-diversion-panel__section-header">Directions</h2>
          {/*
              We need a way to let the form area take up exactly the space of its content
              (to avoid double scrollbars). We used this approach:
              https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas

              The result is that the Form.Control has an invisible twin that helps the
              wrapper grow to the appropriate size, and then the Form.Control likewise
              assumes that space. All styles that affect layout must be identical
              (e.g., `border`, `padding`, `margin`, `font`) between the `<Form.Control/>`
              and the `.c-autosized-textarea::after` pseudo-element.
          */}
          <div
            className="c-autosized-textarea mb-2"
            data-replicated-value={editableDirections}
          >
            <Form.Control
              as="textarea"
              value={editableDirections}
              onChange={({ target: { value } }) => onChangeDetourText(value)}
              data-fs-element="Detour Text"
            />
          </div>
        </section>

        {connectionPoints && (
          <ConnectionPoints connectionPoints={connectionPoints} />
        )}
        {missedStops && <MissedStops missedStops={missedStops} />}
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer className="d-flex flex-column">
        {onDeleteDetour && (
          <Button
            className="m-3 mb-0 flex-grow-1 icon-link c-diversion-panel__deletion-button"
            variant="outline-ui-alert"
            onClick={onDeleteDetour}
            data-fs-element="Delete Detour Draft"
            title="Delete Draft"
          >
            <BsIcons.Trash />
            Delete draft
          </Button>
        )}
        {onActivateDetour && (
          <Button
            className="m-3 flex-grow-1 icon-link"
            onClick={onActivateDetour}
            data-fs-element="Begin Activate Detour"
          >
            <BsIcons.Power />
            Start detour
          </Button>
        )}
      </Panel.Body.Footer>
    </Panel.Body>
    {children}
  </Panel>
)
