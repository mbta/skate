import React from "react"
import { RttTab } from "./types"
import { RttQueueItem } from "./queueItem"
import { RttDetailsPanel } from "./detailsPanel"
import { ActiveRttBanner } from "./activeBanner"
import { useRttQueue, UseRttQueueOptions } from "./useRttQueue"
import { joinClasses } from "../../../helpers/dom"

interface TabConfig {
  id: RttTab
  label: string
}

const QUEUE_TABS: readonly TabConfig[] = [
  { id: "incoming", label: "Incoming" },
  { id: "past", label: "Past" },
]

const EMPTY_STATE_CONTENT: Record<
  RttTab,
  { title: string; description: string }
> = {
  incoming: {
    title: "No Incoming RTT Calls",
    description:
      "Incoming and active driver requests to talk will appear here.",
  },
  past: {
    title: "No Past RTT Calls",
    description: "Completed calls marked as done will appear here.",
  },
}

export type RttQueueProps = UseRttQueueOptions

export const RttQueue = (props: RttQueueProps): JSX.Element => {
  const { calls, tabs, actions } = useRttQueue(props)
  const emptyState = EMPTY_STATE_CONTENT[tabs.current]

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
          {QUEUE_TABS.map(({ id, label }) => {
            const isActive = tabs.current === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`rtt-tab-${id}`}
                aria-selected={isActive}
                aria-controls={`rtt-panel-${id}`}
                className={joinClasses([
                  "c-rtt-queue__tab",
                  isActive && "c-rtt-queue__tab--active",
                ])}
                onClick={() => actions.changeTab(id)}
              >
                {label}
                {id === "incoming" &&
                  tabs.current === "past" &&
                  tabs.newIncomingCount > 0 && (
                    <span className="c-rtt-queue__tab-badge">
                      {tabs.newIncomingCount} new
                    </span>
                  )}
              </button>
            )
          })}
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
                {emptyState.title}
              </div>
              <p className="c-rtt-queue__empty-desc">
                {emptyState.description}
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
