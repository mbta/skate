import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import {
  openNotificationDrawer,
  openSwingsView,
  OpenView,
  toggleMobileMenu,
} from "../../state"
import BottomNavMobile from "./bottomNavMobile"
import TopNavMobile from "./topNavMobile"

const MobilePortraitNav = (): JSX.Element => {
  const [state, dispatch] = useContext(StateDispatchContext)

  const { mobileMenuIsOpen, routeTabs, openView, selectedVehicleOrGhost } =
    state

  const isViewOpen = openView !== OpenView.None || selectedVehicleOrGhost

  const navVisibilityStyle = isViewOpen ? "hidden" : "visible"

  return (
    <>
      <div
        className="m-nav__nav-bar m-nav__nav-bar--top"
        style={{ visibility: navVisibilityStyle }}
      >
        <TopNavMobile
          toggleMobileMenu={() => dispatch(toggleMobileMenu())}
          openNotificationDrawer={() => dispatch(openNotificationDrawer())}
          routeTabs={routeTabs}
          mobileMenuIsOpen={mobileMenuIsOpen}
        />
      </div>

      <div
        className="m-nav__nav-bar m-nav__nav-bar--bottom"
        style={{ visibility: navVisibilityStyle }}
      >
        <BottomNavMobile
          mobileMenuIsOpen={mobileMenuIsOpen}
          openSwingsView={() => dispatch(openSwingsView())}
        />
      </div>
    </>
  )
}

export default MobilePortraitNav
