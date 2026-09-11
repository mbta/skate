import { describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, screen, within } from "@testing-library/react"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("RttQueue Component", () => {
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

    render(
      <RttQueue
        initialState={{
          incomingCalls: [call1, call2],
          pastCalls: [],
          tab: "incoming",
        }}
      />
    )

    expect(screen.getByText("📻 Radio RTT Queue")).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Select Emergency call for vehicle 2104",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Select PRTT call for vehicle 1845",
      })
    ).toBeInTheDocument()

    // Click emergency row button
    const emergencyRow = screen.getByRole("button", {
      name: "Select Emergency call for vehicle 2104",
    })
    fireEvent.click(emergencyRow)

    // Details panel should populate
    expect(
      screen.getByText("Harvard Ave @ Commonwealth Ave")
    ).toBeInTheDocument()
    expect(screen.getByText("#54321 J. Doe")).toBeInTheDocument()
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

    render(
      <RttQueue
        initialState={{
          incomingCalls: [call1, call2],
          pastCalls: [],
          tab: "incoming",
        }}
      />
    )

    const emergencyItem = screen
      .getByRole("button", {
        name: "Select Emergency call for vehicle 3001",
      })
      .closest<HTMLElement>('[role="listitem"]')!
    const respondButton = within(emergencyItem).getByRole("button", {
      name: /respond/i,
    })
    fireEvent.click(respondButton)

    // Should now display Live Call in details panel and Mark done button
    expect(screen.getByText("Live Call")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /mark done/i })
    ).toBeInTheDocument()
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

    render(
      <RttQueue
        initialState={{
          incomingCalls: [call1, call2],
          pastCalls: [],
          tab: "incoming",
        }}
      />
    )

    // Respond to call 1 (Emergency)
    const emergencyItem = screen
      .getByRole("button", {
        name: "Select Emergency call for vehicle 3001",
      })
      .closest<HTMLElement>('[role="listitem"]')!
    fireEvent.click(
      within(emergencyItem).getByRole("button", { name: /respond/i })
    )

    // Now respond to call 2 (PRTT)
    const prttItem = screen
      .getByRole("button", {
        name: "Select PRTT call for vehicle 3002",
      })
      .closest<HTMLElement>('[role="listitem"]')!
    fireEvent.click(within(prttItem).getByRole("button", { name: /respond/i }))

    // Check Past tab to verify call1 was archived as done
    fireEvent.click(screen.getByRole("tab", { name: /^past$/i }))
    expect(screen.getByText("3001")).toBeInTheDocument()
  })

  test("displays active call banner on Past tab and selects active call when clicked", () => {
    const call1 = rttCallFactory.build({
      id: "call-banner-1",
      vehicleId: "4001",
      callType: "Emergency",
      status: "unassigned",
    })

    render(
      <RttQueue
        initialState={{
          incomingCalls: [call1],
          pastCalls: [],
          tab: "incoming",
        }}
      />
    )

    // Respond to the emergency call
    const respondBtn = screen.getByRole("button", { name: /respond/i })
    fireEvent.click(respondBtn)

    // Switch to Past tab
    const pastTabBtn = screen.getByRole("tab", { name: /^past$/i })
    fireEvent.click(pastTabBtn)

    // Active banner button should appear at top
    const bannerButton = screen.getByRole("button", {
      name: `ACTIVE EMERGENCY VEHICLE ${call1.vehicleId}`,
    })
    expect(bannerButton).toBeInTheDocument()

    // Clicking banner button selects the active call in details panel
    fireEvent.click(bannerButton)
    expect(screen.getByText("Live Call")).toBeInTheDocument()
  })

  test("marking done moves call from incoming to past", () => {
    const call = rttCallFactory.build({
      id: "call-done-1",
      vehicleId: "5001",
      callType: "Emergency",
      status: "unassigned",
    })

    render(
      <RttQueue
        initialState={{
          incomingCalls: [call],
          pastCalls: [],
          tab: "incoming",
        }}
      />
    )

    // Respond to the call
    fireEvent.click(screen.getByRole("button", { name: /respond/i }))

    // Click Mark done
    fireEvent.click(screen.getByRole("button", { name: /mark done/i }))

    // Empty state should be visible on incoming tab
    expect(screen.getByText("No Incoming RTT Calls")).toBeInTheDocument()

    // Switch to Past tab and verify it's rendered as a list item
    fireEvent.click(screen.getByRole("tab", { name: /^past$/i }))
    expect(screen.getByRole("listitem")).toHaveTextContent("5001")
  })

  test.each([
    {
      tab: "incoming" as const,
      expectedHeading: "No Incoming RTT Calls",
      expectedDesc:
        "Incoming and active driver requests to talk will appear here.",
    },
    {
      tab: "past" as const,
      expectedHeading: "No Past RTT Calls",
      expectedDesc: "Completed calls marked as done will appear here.",
    },
  ])(
    "renders appropriate empty state when $tab queue has no calls",
    ({ tab, expectedHeading, expectedDesc }) => {
      render(
        <RttQueue
          initialState={{
            incomingCalls: [],
            pastCalls: [],
            tab,
          }}
        />
      )

      expect(screen.getByText(expectedHeading)).toBeInTheDocument()
      expect(screen.getByText(expectedDesc)).toBeInTheDocument()
    }
  )

  test("renders unread incoming count badge when viewing past tab with new calls", () => {
    render(
      <RttQueue
        initialState={{
          incomingCalls: [],
          pastCalls: [],
          tab: "past",
          newIncomingCount: 4,
        }}
      />
    )

    expect(screen.getByText("4 new")).toBeInTheDocument()
  })
})
