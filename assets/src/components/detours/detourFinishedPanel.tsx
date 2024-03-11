import React from "react"
import { Button, Form, OverlayTrigger, Popover } from "react-bootstrap"
import * as BsIcons from "../../helpers/bsIcons"
import { Panel } from "./diversionPage"

export const DetourFinishedPanel = ({
  onNavigateBack,
  detourText,
  onChangeDetourText,
}: {
  onNavigateBack: () => void
  detourText: string
  onChangeDetourText: (value: string) => void
}) => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">Share Detour Details</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      {/* The easiest way to make the `<textarea/>` fit the panel is to use flex */}
      <Panel.Body.ScrollArea className="d-flex flex-column">
        <Button
          className="align-self-start icon-link my-3"
          variant="outline-primary"
          onClick={onNavigateBack}
        >
          <BsIcons.ArrowLeft /> Edit Detour
        </Button>

        <Form.Control
          as="textarea"
          value={detourText}
          onChange={({ target: { value } }) => onChangeDetourText(value)}
          className="flex-grow-1 mb-3"
          style={{
            resize: "none",
          }}
        />
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer className="d-flex">
        <OverlayTrigger
          placement="top"
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
            className="m-3 flex-grow-1"
            onClick={() => window.navigator.clipboard?.writeText(detourText)}
          >
            Copy Details
          </Button>
        </OverlayTrigger>
      </Panel.Body.Footer>
    </Panel.Body>
  </Panel>
)
