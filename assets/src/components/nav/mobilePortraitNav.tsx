import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { toggleMobileMenu } from "../../state"
import BottomNavMobile from "./bottomNavMobile"
import TopNavMobile from "./topNavMobile"
import { usePanelStateFromStateDispatchContext } from "../../hooks/usePanelState"

const MobilePortraitNav = ({
  isViewOpen,
}: {
  isViewOpen: boolean
}): JSX.Element => {
  const [state, dispatch] = useContext(StateDispatchContext)

  const { mobileMenuIsOpen, routeTabs } = state
  const { openNotificationDrawer, openSwingsView } =
    usePanelStateFromStateDispatchContext()

  const navVisibilityStyle = isViewOpen ? "hidden" : "visible"

  return (
    <>
      <div
        className="l-nav__nav-bar l-nav__nav-bar--top"
        style={{ visibility: navVisibilityStyle }}
      >
        <TopNavMobile
          toggleMobileMenu={() => dispatch(toggleMobileMenu())}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={routeTabs}
          mobileMenuIsOpen={mobileMenuIsOpen}
        />
      </div>

      <div
        className="l-nav__nav-bar l-nav__nav-bar--bottom"
        style={{ visibility: navVisibilityStyle }}
      >
        <BottomNavMobile
          mobileMenuIsOpen={mobileMenuIsOpen}
          openSwingsView={openSwingsView}
        />
      </div>
    </>
  )
}

export default MobilePortraitNav
