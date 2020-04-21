import React from "react"
import { Tab, Tabs, TabList, TabPanel } from "react-tabs"

interface Props {
  statusContent: JSX.Element
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

const StatusRunBlockTabs = ({ statusContent }: Props) => (
  <div className="m-tabs">
    <Tabs className="m-tabs__tabs">
      <TabList className="m-tabs__tab-list">
        <Tab className="m-tabs__tab" selectedClassName="m-tabs__tab--selected">
          <TabStatusIcon />
          Status
        </Tab>
        <Tab className="m-tabs__tab" selectedClassName="m-tabs__tab--selected">
          <TabStatusIcon />
          Run
        </Tab>
        <Tab className="m-tabs__tab" selectedClassName="m-tabs__tab--selected">
          <TabStatusIcon />
          Block
        </Tab>
      </TabList>

      <TabPanel
        className="m-tabs__tab-panel"
        selectedClassName="m-tabs__tab-panel--selected"
      >
        {statusContent}
      </TabPanel>
      <TabPanel
        className="m-tabs__tab-panel"
        selectedClassName="m-tabs__tab-panel--selected"
      >
        <h2>Run Content</h2>
      </TabPanel>
      <TabPanel
        className="m-tabs__tab-panel"
        selectedClassName="m-tabs__tab-panel--selected"
      >
        <h2>Block Content</h2>
      </TabPanel>
    </Tabs>
  </div>
)

export default StatusRunBlockTabs
