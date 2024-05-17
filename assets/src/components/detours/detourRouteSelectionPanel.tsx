import React from "react"
import { Button } from "react-bootstrap"
import { Panel } from "./diversionPage"
import { Route } from "../../schedule"

export interface DetourRouteSelectionPanelProps {
  routeName: string,
  route: Route
}

export const DetourRouteSelectionPanel = ({
  routeName,
}: DetourRouteSelectionPanelProps) => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">Create Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      <Panel.Body.ScrollArea className="d-flex flex-column">
        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Choose route</h2>
          <p>{routeName}</p>
        </section>

        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Choose direction</h2>
          <p className="fst-italic">
            Select a route in order to choose a direction.
          </p>
        </section>
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer className="d-flex">
        <Button className="m-3 flex-grow-1" onClick={() => {}}>
          Start drawing detour
        </Button>
      </Panel.Body.Footer>
    </Panel.Body>
  </Panel>
)
