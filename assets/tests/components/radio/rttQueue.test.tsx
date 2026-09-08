import { describe, test, expect, afterEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, cleanup, within } from "@testing-library/react"
import { RttQueue } from "../../../src/components/radio/rtts/queue"
import {
  sortRttCalls,
  sortPastRttCalls,
  getCallTimestamp,
} from "../../../src/components/radio/rtts/types"
import { rttCallFactory } from "../../factories/radio/rtt"

describe("RTT Domain & Sorting", () => {
  afterEach(cleanup)
  test("sorts calls by priority (Emergency > PRTT > RTT) and then by timestamp (newest first)", () => {
    const olderTime = new Date("2026-09-03T10:00:00Z")
    const newerTime = new Date("2026-09-03T10:05:00Z")

    const rttNew = rttCallFactory.build({
      callType: "RTT",
      receivedAt: newerTime,
    })
    const rttOld = rttCallFactory.build({
      callType: "RTT",
      receivedAt: olderTime,
    })
    const prttOld = rttCallFactory.build({
      callType: "PRTT",
      receivedAt: olderTime,
    })
    const prttNew = rttCallFactory.build({
      callType: "PRTT",
      receivedAt: newerTime,
    })
    const emergencyOld = rttCallFactory.build({
      callType: "Emergency",
      receivedAt: olderTime,
    })
    const emergencyNew = rttCallFactory.build({
      callType: "Emergency",
      receivedAt: newerTime,
    })

    const unsorted = [
      rttNew,
      prttOld,
      emergencyOld,
      rttOld,
      emergencyNew,
      prttNew,
    ]
    const sorted = sortRttCalls(unsorted)

    expect(
      sorted.map((c) => `${c.callType}-${new Date(c.receivedAt).toISOString()}`)
    ).toEqual([
      `Emergency-${new Date(emergencyNew.receivedAt).toISOString()}`,
      `Emergency-${new Date(emergencyOld.receivedAt).toISOString()}`,
      `PRTT-${new Date(prttNew.receivedAt).toISOString()}`,
      `PRTT-${new Date(prttOld.receivedAt).toISOString()}`,
      `RTT-${new Date(rttNew.receivedAt).toISOString()}`,
      `RTT-${new Date(rttOld.receivedAt).toISOString()}`,
    ])
  })

  test("sortPastRttCalls sorts calls by timestamp descending (newest first)", () => {
    const callOld = rttCallFactory.build({
      id: "old",
      receivedAt: "2026-09-08T10:00:00Z",
    })
    const callNew = rttCallFactory.build({
      id: "new",
      receivedAt: new Date("2026-09-08T10:10:00Z"),
    })

    expect(getCallTimestamp(callOld.receivedAt)).toBe(
      new Date("2026-09-08T10:00:00Z").getTime()
    )
    expect(getCallTimestamp(callNew.receivedAt)).toBe(
      new Date("2026-09-08T10:10:00Z").getTime()
    )

    const sorted = sortPastRttCalls([callOld, callNew])
    expect(sorted.map((c) => c.id)).toEqual(["new", "old"])
  })
})

describe("RttQueue Component", () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ""
  })

  test("renders incoming calls and displays call details when row is clicked", () => {
    const call1 = rttCallFactory.build({
      id: "call-1",
      vehicleId: "2104",
      callType: "Emergency",
      currentLocation: "Harvard Ave @ Commonwealth Ave",
      operatorBadge: "54321",
      operatorName: "J. Doe",
    })
    const call2 = rttCallFactory.build({
      id: "call-2",
      vehicleId: "1845",
      callType: "PRTT",
    })

    const { container } = render(
      <RttQueue
        defaultIncomingCalls={[call1, call2]}
        defaultPastCalls={[]}
        defaultTab="incoming"
      />
    )
    const view = within(container)

    // Verify incoming tab content
    expect(view.getByText("📻 Radio RTT Queue")).toBeInTheDocument()
    expect(view.getByText("2104")).toBeInTheDocument()
    expect(view.getByText("1845")).toBeInTheDocument()

    // Click emergency row
    fireEvent.click(view.getByText("2104"))

    // Details panel should populate
    expect(view.getByText("Harvard Ave @ Commonwealth Ave")).toBeInTheDocument()
    expect(view.getByText("#54321 J. Doe")).toBeInTheDocument()
  })

  test("responding to an incoming call transitions it to live mode with Mark Done action", () => {
    const call1 = rttCallFactory.build({
      id: "call-resp-1",
      vehicleId: "3001",
      callType: "Emergency",
      status: "unassigned",
    })
    const call2 = rttCallFactory.build({
      id: "call-resp-2",
      vehicleId: "3002",
      callType: "RTT",
      status: "unassigned",
    })

    const { container } = render(
      <RttQueue
        defaultIncomingCalls={[call1, call2]}
        defaultPastCalls={[]}
        defaultTab="incoming"
      />
    )
    const view = within(container)

    const respondButtons = view.getAllByRole("button", { name: /respond/i })
    fireEvent.click(respondButtons[0])

    // Should now display Live Call in details panel and Mark done button
    expect(view.getByText("Live Call")).toBeInTheDocument()
    expect(view.getByRole("button", { name: /mark done/i })).toBeInTheDocument()
  })

  test("responding to a second call moves previous active call to past calls", () => {
    const call1 = rttCallFactory.build({
      id: "call-seq-1",
      vehicleId: "3001",
      callType: "Emergency",
      status: "unassigned",
    })
    const call2 = rttCallFactory.build({
      id: "call-seq-2",
      vehicleId: "3002",
      callType: "PRTT",
      status: "unassigned",
    })

    const { container } = render(
      <RttQueue
        defaultIncomingCalls={[call1, call2]}
        defaultPastCalls={[]}
        defaultTab="incoming"
      />
    )
    const view = within(container)

    // Respond to call 1 (Emergency)
    const respondButtons = view.getAllByRole("button", { name: /respond/i })
    fireEvent.click(respondButtons[0])

    // Now respond to call 2 (PRTT)
    const secondRespondBtn = view.getByRole("button", { name: /respond/i })
    fireEvent.click(secondRespondBtn)

    // Check Past tab to verify call1 was archived as done
    fireEvent.click(view.getByRole("tab", { name: /^past$/i }))
    expect(view.getByText("3001")).toBeInTheDocument()
  })

  test("displays active call banner when switching to Past tab during an active call", () => {
    const call1 = rttCallFactory.build({
      id: "call-banner-1",
      vehicleId: "4001",
      callType: "Emergency",
      status: "unassigned",
    })

    const { container } = render(
      <RttQueue
        defaultIncomingCalls={[call1]}
        defaultPastCalls={[]}
        defaultTab="incoming"
      />
    )
    const view = within(container)

    // Respond to the emergency call
    const respondBtn = view.getByRole("button", { name: /respond/i })
    fireEvent.click(respondBtn)

    // Switch to Past tab
    const pastTabBtn = view.getByRole("tab", { name: /^past$/i })
    fireEvent.click(pastTabBtn)

    // Active banner should appear at top
    expect(
      view.getByText(`ACTIVE CALL VEHICLE ${call1.vehicleId}`)
    ).toBeInTheDocument()
  })

  test("marking done moves call from incoming to past", () => {
    const call1 = rttCallFactory.build({
      id: "call-done-1",
      vehicleId: "5001",
      callType: "Emergency",
      status: "unassigned",
    })

    const { container } = render(
      <RttQueue
        defaultIncomingCalls={[call1]}
        defaultPastCalls={[]}
        defaultTab="incoming"
      />
    )
    const view = within(container)

    // Respond to the call
    fireEvent.click(view.getByRole("button", { name: /respond/i }))

    // Click Mark done
    fireEvent.click(view.getByRole("button", { name: /mark done/i }))

    // Empty state should be visible on incoming tab
    expect(view.getByText("No Incoming RTT Calls")).toBeInTheDocument()

    // Switch to Past tab and verify it's there
    fireEvent.click(view.getByRole("tab", { name: /^past$/i }))
    expect(view.getAllByText(`${call1.vehicleId}`)[0]).toBeInTheDocument()
  })
})
