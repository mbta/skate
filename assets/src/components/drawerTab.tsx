import React from "react"

import { CollapseIcon, ExpandIcon } from "../helpers/icon"

const DrawerTab = ({
  isVisible,
  toggleVisibility,
}: {
  isVisible: boolean
  toggleVisibility: () => void
}) => (
  <button
    className="c-drawer-tab c-drawer-tab__tab-button"
    onClick={toggleVisibility}
    title={isVisible ? "Collapse" : "Expand"}
  >
    {isVisible ? <CollapseIcon /> : <ExpandIcon />}
  </button>
)

export default DrawerTab
