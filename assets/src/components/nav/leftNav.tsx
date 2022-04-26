import React, { useState } from "react"

interface Props {
  defaultToCollapsed: boolean
}

const LeftNav = ({ defaultToCollapsed }: Props): JSX.Element => {
  const [collapsed, setCollapsed] = useState<boolean>(defaultToCollapsed)

  return (
    <div className={"m-left-nav" + (collapsed ? " m-left-nav--collapsed" : "")}>
      Left nav goes here. Collapsed: {collapsed ? "true" : "false"}
      <button onClick={() => setCollapsed(!collapsed)}>Toggle Collapsed</button>
    </div>
  )
}

export default LeftNav
