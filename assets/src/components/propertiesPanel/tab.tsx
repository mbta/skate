import React, { Dispatch, SetStateAction } from "react"
import { TabMode } from "./tabPanels"

const TabStatusIcon = () => (
  <svg className="m-tabs__tab-status-icon" width="14" height="14">
    <circle
      className="m-tabs__tab-status-icon-outer-circle"
      cx="7"
      cy="7"
      r="6"
    />
    <circle
      className="m-tabs__tab-status-icon-inner-circle"
      cx="7"
      cy="7"
      r="4"
    />
  </svg>
)

const Tab = ({
  tabName,
  activeTab,
  setActiveTab,
}: {
  tabName: TabMode
  activeTab: TabMode
  setActiveTab: Dispatch<SetStateAction<TabMode>>
}) => {
  const classes =
    tabName === activeTab ? "m-tabs__tab m-tabs__tab--selected" : "m-tabs__tab"

  const tabTitle = tabName[0].toUpperCase() + tabName.slice(1)
  const clickCallback = () => setActiveTab(tabName)

  return (
    <li className={classes} onClick={clickCallback}>
      <TabStatusIcon />
      {tabTitle}
    </li>
  )
}

export default Tab
