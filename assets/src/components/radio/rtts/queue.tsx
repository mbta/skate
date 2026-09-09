import React from "react"
import { RttQueueItem } from "./queueItem"
import { RttDetailsPanel } from "./detailsPanel"
import { ActiveRttBanner } from "./activeBanner"
import { useRttQueue, UseRttQueueOptions } from "./useRttQueue"

export type RttQueueProps = UseRttQueueOptions

export const RttQueue = (props: RttQueueProps): JSX.Element => {
  const { calls, tabs, actions } = useRttQueue(props)

  return (
    <div className="c-rtt-queue">
      {tabs.current === "past" && calls.active && (
        <ActiveRttBanner
          activeCall={calls.active}
          onMarkDone={actions.markDoneCall}
          onSelectActive={actions.selectCall}
        />
      )}

      <header className="c-rtt-queue__header">
        <h1 className="c-rtt-queue__title">📻 Radio RTT Queue</h1>

        <div
          className="c-rtt-queue__tabs"
          role="tablist"
          aria-label="RTT Queue Views"
        >
          <button
            type="button"
            role="tab"
            id="rtt-tab-incoming"
            aria-selected={tabs.current === "incoming"}
            aria-controls="rtt-panel-incoming"
            className={`c-rtt-queue__tab ${
              tabs.current === "incoming" ? "c-rtt-queue__tab--active" : ""
            }`}
            onClick={() => actions.changeTab("incoming")}
          >
            Incoming
            {tabs.current === "past" && tabs.newIncomingCount > 0 && (
              <span className="c-rtt-queue__tab-badge">
                {tabs.newIncomingCount} new
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            id="rtt-tab-past"
            aria-selected={tabs.current === "past"}
            aria-controls="rtt-panel-past"
            className={`c-rtt-queue__tab ${
              tabs.current === "past" ? "c-rtt-queue__tab--active" : ""
            }`}
            onClick={() => actions.changeTab("past")}
          >
            Past
          </button>
        </div>
      </header>

      <div className="c-rtt-queue__body">
        <section
          className="c-rtt-queue__list-pane"
          role="tabpanel"
          id={`rtt-panel-${tabs.current}`}
          aria-labelledby={`rtt-tab-${tabs.current}`}
        >
          {calls.activeList.length === 0 ? (
            <div className="c-rtt-queue__empty">
              <div className="c-rtt-queue__empty-icon">📻</div>
              <div className="c-rtt-queue__empty-title">
                {tabs.current === "incoming"
                  ? "No Incoming RTT Calls"
                  : "No Past RTT Calls"}
              </div>
              <p className="c-rtt-queue__empty-desc">
                {tabs.current === "incoming"
                  ? "Incoming and active driver requests to talk will appear here."
                  : "Completed calls marked as done will appear here."}
              </p>
            </div>
          ) : (
            <div
              role="list"
              aria-label={
                tabs.current === "incoming"
                  ? "Incoming RTT Calls"
                  : "Past RTT Calls"
              }
            >
              {calls.activeList.map((call) => (
                <RttQueueItem
                  key={call.id}
                  call={call}
                  tab={tabs.current}
                  currentDispatcherName={props.currentDispatcherName}
                  isSelected={calls.selectedId === call.id}
                  onSelect={actions.selectCall}
                  onRespond={actions.respondCall}
                />
              ))}
            </div>
          )}
        </section>

        <section
          className="c-rtt-queue__details-pane"
          aria-label="Call details"
        >
          <RttDetailsPanel
            call={calls.selected}
            isLive={calls.isSelectedLive}
            onMarkDone={actions.markDoneCall}
          />
        </section>
      </div>
    </div>
  )
}
