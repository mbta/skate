import React from "react"
import { RttQueueItem } from "./queueItem"
import { RttDetailsPanel } from "./detailsPanel"
import { ActiveRttBanner } from "./activeBanner"
import { useRttQueue, UseRttQueueOptions } from "./useRttQueue"

export type RttQueueProps = UseRttQueueOptions

export const RttQueue = (props: RttQueueProps): JSX.Element => {
  const {
    tab,
    selectedCallId,
    newIncomingCount,
    activeCallsList,
    selectedCall,
    activeCall,
    isSelectedLive,
    handleTabClick,
    handleSelectCall,
    handleRespondCall,
    handleMarkDoneCall,
  } = useRttQueue(props)

  return (
    <div className="c-rtt-queue">
      {tab === "past" && activeCall && (
        <ActiveRttBanner
          activeCall={activeCall}
          onMarkDone={handleMarkDoneCall}
          onSelectActive={handleSelectCall}
        />
      )}

      <header className="c-rtt-queue__header">
        <h1 className="c-rtt-queue__title">📻 Radio RTT Queue</h1>

        <nav className="c-rtt-queue__tabs" aria-label="RTT Queue Views">
          <button
            type="button"
            className={`c-rtt-queue__tab ${
              tab === "incoming" ? "c-rtt-queue__tab--active" : ""
            }`}
            onClick={() => handleTabClick("incoming")}
          >
            Incoming
            {tab === "past" && newIncomingCount > 0 && (
              <span className="c-rtt-queue__tab-badge">
                {newIncomingCount} new
              </span>
            )}
          </button>
          <button
            type="button"
            className={`c-rtt-queue__tab ${
              tab === "past" ? "c-rtt-queue__tab--active" : ""
            }`}
            onClick={() => handleTabClick("past")}
          >
            Past
          </button>
        </nav>
      </header>

      <div className="c-rtt-queue__body">
        <section className="c-rtt-queue__list-pane" aria-label="Calls list">
          {activeCallsList.length === 0 ? (
            <div className="c-rtt-queue__empty">
              <div className="c-rtt-queue__empty-icon">📻</div>
              <div className="c-rtt-queue__empty-title">
                {tab === "incoming"
                  ? "No Incoming RTT Calls"
                  : "No Past RTT Calls"}
              </div>
              <p className="c-rtt-queue__empty-desc">
                {tab === "incoming"
                  ? "Incoming and active driver requests to talk will appear here."
                  : "Completed calls marked as done will appear here."}
              </p>
            </div>
          ) : (
            activeCallsList.map((call) => (
              <RttQueueItem
                key={call.id}
                call={call}
                tab={tab}
                isSelected={selectedCallId === call.id}
                onSelect={handleSelectCall}
                onRespond={handleRespondCall}
              />
            ))
          )}
        </section>

        <section
          className="c-rtt-queue__details-pane"
          aria-label="Call details"
        >
          <RttDetailsPanel
            call={selectedCall}
            isLive={isSelectedLive}
            onMarkDone={handleMarkDoneCall}
          />
        </section>
      </div>
    </div>
  )
}
