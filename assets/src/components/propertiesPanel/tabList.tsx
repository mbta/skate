import React from "react"

import { TabMode } from "./tabPanels"

interface Props {
  activeTab: TabMode
  setActiveTab: (tabMode: TabMode) => void
}

const TabStatusIcon = () => (
  <svg className="c-tabs__tab-status-icon" width="14" height="14">
    <circle
      className="c-tabs__tab-status-icon-outer-circle"
      cx="7"
      cy="7"
      r="6"
    />
    <circle
      className="c-tabs__tab-status-icon-inner-circle"
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
  setActiveTab: (tabMode: TabMode) => void
}) => {
  const classes =
    tabName === activeTab ? "c-tabs__tab c-tabs__tab--selected" : "c-tabs__tab"

  const tabTitle = tabName[0].toUpperCase() + tabName.slice(1)
  const clickCallback = () => setActiveTab(tabName)

  return (
    <li className={classes}>
      <button
        onClick={clickCallback}
        role="tab"
        aria-selected={tabName === activeTab}
      >
        <TabStatusIcon />
        {tabTitle}
      </button>
    </li>
  )
}

const TabList = ({ activeTab, setActiveTab }: Props) => (
  <ul className="c-tabs__tab-list" role="tablist">
    <Tab tabName="status" activeTab={activeTab} setActiveTab={setActiveTab} />
    <Tab tabName="run" activeTab={activeTab} setActiveTab={setActiveTab} />
    <Tab tabName="block" activeTab={activeTab} setActiveTab={setActiveTab} />
  </ul>
)

export default TabList
