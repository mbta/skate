import React, { useContext } from "react"
import { isPreset } from "../models/routeTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Button } from "react-bootstrap"
import { NavLink } from "react-router-dom"

export const MinimalLadderPage = () => {
  const [{ routeTabs }] = useContext(StateDispatchContext)
  const presets = routeTabs
    .filter(isPreset)
    .sort((a, b) => (a.presetName || "").localeCompare(b.presetName || ""))

  return (
    <div className="c-minimal-ladder-page">
      <h3>Select a preset to display</h3>
      {presets.map((preset) => (
        <NavLink key={preset.uuid} to={"/minimal/" + preset.uuid}>
          <Button className="c-minimal-ladder-page__button">
            {preset.presetName}
          </Button>
        </NavLink>
      ))}
    </div>
  )
}
