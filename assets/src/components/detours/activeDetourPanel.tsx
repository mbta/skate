import React from "react"
import { Panel } from "./diversionPage"
import { Button } from "react-bootstrap"

export const ActiveDetourPanel = ({
  onDeactivateDetour,
}: {
  onDeactivateDetour: () => void
}) => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">Active Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      <Panel.Body.Footer>
        <Button
          className="m-3 flex-grow-1"
          variant="missed-stop"
          onClick={onDeactivateDetour}
        >
          Deactivate Detour
        </Button>
      </Panel.Body.Footer>
    </Panel.Body>
  </Panel>
)
