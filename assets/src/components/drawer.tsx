import React, { ReactElement, useState } from "react"
import DrawerTab from "../components/drawerTab"
import { joinClasses } from "../helpers/dom"

interface Props {
  children?: ReactElement<HTMLElement>
}

const Drawer = ({ children }: Props): ReactElement<HTMLDivElement> => {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const toggleDrawer = () => setDrawerOpen((drawerOpen) => !drawerOpen)

  return (
    <>
      <div
        className={joinClasses([
          "c-drawer",
          ...(drawerOpen
            ? ["c-drawer--visible"]
            : ["c-drawer--hidden", "u-hideable--hidden"]),
        ])}
      >
        <DrawerTab isVisible={drawerOpen} toggleVisibility={toggleDrawer} />
        {children}
      </div>
      <button onClick={toggleDrawer} className="c-drawer__backdrop-button" />
    </>
  )
}

export default Drawer
