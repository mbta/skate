import React, { PropsWithChildren } from "react"
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
  connectionPoints?: [string, string]
  missedStops?: Stop[]
  onChangeDetourText: (value: string) => void
  onActivateDetour?: () => void
}

export const DetourFinishedPanel = ({
  onNavigateBack,
  copyableDetourText,
  connectionPoints,
  missedStops,
  onChangeDetourText,
  onActivateDetour,
  children,
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

        <Form.Control
          as="textarea"
          value={copyableDetourText}
          onChange={({ target: { value } }) => onChangeDetourText(value)}
          className="flex-grow-1 mb-3"
          style={{
            resize: "none",
          }}
          data-fs-element="Detour Text"
        />

        {connectionPoints && (
          <ConnectionPoints connectionPoints={connectionPoints} />
        )}
        {missedStops && <MissedStops missedStops={missedStops} />}
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer className="d-flex flex-column">
        {onActivateDetour && (
          <Button
            className="m-3 flex-grow-1 icon-link justify-content-center"
            onClick={onActivateDetour}
            data-fs-element="Begin Activate Detour"
          >
            <BsIcons.Power />
            Start Detour
          </Button>
        )}
      </Panel.Body.Footer>
    </Panel.Body>
    {children}
  </Panel>
)
