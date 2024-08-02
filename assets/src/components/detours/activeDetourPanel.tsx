import React from "react"
import { Panel } from "./diversionPage"

export const ActiveDetourPanel = () => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">Active Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column"></Panel.Body>
  </Panel>
)
