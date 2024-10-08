import React, { PropsWithChildren, useState } from "react"
import DrawerTab from "../components/drawerTab"
import { joinClasses } from "../helpers/dom"

interface Props {
  open?: boolean
  onToggleOpen?: () => void
}

const Drawer = ({
  open = true,
  onToggleOpen,
  children,
}: PropsWithChildren<Props>) => (
  <>
    <div
      className={joinClasses([
        "c-drawer",
        ...(open
          ? ["c-drawer--visible"]
          : ["c-drawer--hidden", "u-hideable--hidden"]),
      ])}
    >
      <DrawerTab
        isVisible={open}
        toggleVisibility={onToggleOpen || (() => {})}
      />
      {children}
    </div>
    <button onClick={onToggleOpen} className="c-drawer__backdrop-button" />
  </>
)

interface DrawerWithStateProps {
  startOpen?: boolean
  onToggleOpen: Props["onToggleOpen"]
}

const DrawerWithState = (props: PropsWithChildren<DrawerWithStateProps>) => {
  const [drawerOpen, setDrawerOpen] = useState(props.startOpen)

  return (
    <Drawer
      open={drawerOpen}
      onToggleOpen={() => setDrawerOpen((drawerOpen) => !drawerOpen)}
    >
      {props.children}
    </Drawer>
  )
}

Drawer.WithState = DrawerWithState

export default Drawer
