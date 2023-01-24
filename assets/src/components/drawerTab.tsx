import React from "react"

import { CollapseIcon, ExpandIcon } from "../helpers/icon"

const DrawerTab = ({
  isVisible,
  toggleVisibility,
}: {
  isVisible: boolean
  toggleVisibility: () => void
}) => (
  <div className="c-drawer-tab">
    <button
      className="c-drawer-tab__tab-button"
      onClick={toggleVisibility}
      title={isVisible ? "Collapse" : "Expand"}
    >
      {isVisible ? <CollapseIcon /> : <ExpandIcon />}
    </button>
  </div>
)

export default DrawerTab
