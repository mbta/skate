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

const MobilePortraitNav = ({
  children,
}: {
  children?: React.ReactNode | undefined
}): JSX.Element => {
  const [state, dispatch] = useContext(StateDispatchContext)

  const { mobileMenuIsOpen, routeTabs, openView, selectedVehicleOrGhost } =
    state

  if (openView !== OpenView.None || selectedVehicleOrGhost) {
    return (
      <div className="m-nav--narrow m-nav--covered">
        <div className="m-nav__app-content">{children}</div>
      </div>
    )
  } else {
    return (
      <div className="m-nav--narrow">
        <div className="m-nav__nav-bar m-nav__nav-bar--top">
          <TopNavMobile
            toggleMobileMenu={() => dispatch(toggleMobileMenu())}
            openNotificationDrawer={() => dispatch(openNotificationDrawer())}
            routeTabs={routeTabs}
            mobileMenuIsOpen={mobileMenuIsOpen}
          />
        </div>
        <div className="m-nav__app-content">{children}</div>
        <div className="m-nav__nav-bar m-nav__nav-bar--bottom">
          <BottomNavMobile
            mobileMenuIsOpen={mobileMenuIsOpen}
            openSwingsView={() => dispatch(openSwingsView())}
          />
        </div>
      </div>
    )
  }
}

export default MobilePortraitNav
