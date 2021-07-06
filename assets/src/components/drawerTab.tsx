import React from "react"

import { collapseIcon, expandIcon } from "../helpers/icon"

const DrawerTab = ({
  isVisible,
  toggleVisibility,
}: {
  isVisible: boolean
  toggleVisibility: () => void
}) => (
  <div className="c-drawer-tab">
    <button className="c-drawer-tab__tab-button" onClick={toggleVisibility}>
      {isVisible ? collapseIcon() : expandIcon()}
    </button>
  </div>
)

export default DrawerTab
