import React from "react"
import { Panel } from "./diversionPage"

export const PastDetourPanel = () => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">Past Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column"></Panel.Body>
  </Panel>
)
