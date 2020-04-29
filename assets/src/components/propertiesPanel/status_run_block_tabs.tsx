import React from "react"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { TripId } from "../../schedule"
import { MinischeduleBlock, MinischeduleRun } from "./minischedule"

interface Props {
  activeTripId: TripId | null
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

const StatusRunBlockTabs = ({ activeTripId, statusContent }: Props) => (
  <Tabs className="m-tabs">
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
      {activeTripId && <MinischeduleRun activeTripId={activeTripId} />}
    </TabPanel>
    <TabPanel
      className="m-tabs__tab-panel"
      selectedClassName="m-tabs__tab-panel--selected"
    >
      {activeTripId && <MinischeduleBlock activeTripId={activeTripId} />}
    </TabPanel>
  </Tabs>
)

export default StatusRunBlockTabs
