import React, { Dispatch, SetStateAction } from "react"

import { TabMode } from "./tabPanels"

interface Props {
  activeTab: TabMode
  setActiveTab: Dispatch<SetStateAction<TabMode>>
}

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
    <>
      {/* eslint-disable jsx-a11y/click-events-have-key-events */}
      <li
        className={classes}
        onClick={clickCallback}
        role="tab"
        aria-selected={tabName === activeTab}
      >
        <TabStatusIcon />
        {tabTitle}
      </li>
      {/* eslint-enable jsx-a11y/click-events-have-key-events */}
    </>
  )
}

const TabList = ({ activeTab, setActiveTab }: Props) => (
  <ul className="m-tabs__tab-list" role="tablist">
    <Tab tabName="status" activeTab={activeTab} setActiveTab={setActiveTab} />
    <Tab tabName="run" activeTab={activeTab} setActiveTab={setActiveTab} />
    <Tab tabName="block" activeTab={activeTab} setActiveTab={setActiveTab} />
  </ul>
)

export default TabList
