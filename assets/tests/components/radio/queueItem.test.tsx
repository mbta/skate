import { describe, test, expect, afterEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, cleanup, within } from "@testing-library/react"
import { RttQueueItem } from "../../../src/components/radio/rtts/queueItem"
import { rttCallFactory } from "../../factories/radio/rtt"
import { RttCallType } from "../../../src/components/radio/rtts/types"

describe("RttQueueItem", () => {
  afterEach(cleanup)

  test.each([
    {
      callType: "Emergency" as RttCallType,
      expectedBorderClass: "c-rtt-queue-item--emergency",
      expectedTypeClass: "c-rtt-queue-item__type--emergency",
    },
    {
      callType: "PRTT" as RttCallType,
      expectedBorderClass: "c-rtt-queue-item--prtt",
      expectedTypeClass: "c-rtt-queue-item__type--prtt",
    },
    {
      callType: "RTT" as RttCallType,
      expectedBorderClass: "c-rtt-queue-item--rtt",
      expectedTypeClass: "c-rtt-queue-item__type--rtt",
    },
  ])(
    "applies correct style classes for $callType call",
    ({ callType, expectedBorderClass, expectedTypeClass }) => {
      const call = rttCallFactory.build({ callType })
      const { container } = render(<RttQueueItem call={call} />)

      const item = container.querySelector(".c-rtt-queue-item")
      expect(item).toHaveClass(expectedBorderClass)

      const badge = container.querySelector(".c-rtt-queue-item__type")
      expect(badge).toHaveClass(expectedTypeClass)
      expect(badge).toHaveTextContent(callType)
    }
  )

  test.each([
    {
      desc: "shows YOU when respondedBy matches currentDispatcherName",
      respondedBy: "Dispatcher Jane",
      currentDispatcherName: "Dispatcher Jane",
      expectedName: "YOU",
    },
    {
      desc: "shows YOU when respondedBy is 'YOU'",
      respondedBy: "YOU",
      currentDispatcherName: "Other",
      expectedName: "YOU",
    },
    {
      desc: "shows other dispatcher name when responded by someone else",
      respondedBy: "Dispatcher Bob",
      currentDispatcherName: "Dispatcher Jane",
      expectedName: "Dispatcher Bob",
    },
    {
      desc: "shows YOU when respondedBy is null/empty on active call",
      respondedBy: null,
      currentDispatcherName: "Dispatcher Jane",
      expectedName: "YOU",
    },
  ])(
    "renders appropriate status badge ($desc)",
    ({ respondedBy, currentDispatcherName, expectedName }) => {
      const call = rttCallFactory.build({
        status: "active",
        respondedBy,
      })

      const { container } = render(
        <RttQueueItem
          call={call}
          tab="incoming"
          currentDispatcherName={currentDispatcherName}
        />
      )
      const view = within(container)

      expect(view.getByText(expectedName)).toBeInTheDocument()
      expect(
        view.queryByRole("button", { name: /respond/i })
      ).not.toBeInTheDocument()
    }
  )

  test("hides action button on past tab", () => {
    const call = rttCallFactory.build({ status: "done" })
    const { container } = render(<RttQueueItem call={call} tab="past" />)
    const view = within(container)

    expect(
      view.queryByRole("button", { name: /respond/i })
    ).not.toBeInTheDocument()
    expect(container.querySelector(".c-rtt-queue-item")).toHaveClass(
      "c-rtt-queue-item--past"
    )
  })

  test("triggers onSelect on click or keyboard Enter/Space", () => {
    const call = rttCallFactory.build({ id: "call-kb", vehicleId: "1234" })
    let selectedCall: typeof call | null = null

    const { container } = render(
      <RttQueueItem call={call} onSelect={(c) => (selectedCall = c)} />
    )
    const clickableColumns = container.querySelector(
      ".c-rtt-queue-item__columns"
    )!

    // Click
    fireEvent.click(clickableColumns)
    expect(selectedCall).toEqual(call)

    selectedCall = null
    // Enter key
    fireEvent.keyDown(clickableColumns, { key: "Enter" })
    expect(selectedCall).toEqual(call)

    selectedCall = null
    // Space key
    fireEvent.keyDown(clickableColumns, { key: " " })
    expect(selectedCall).toEqual(call)
  })

  test("triggers onRespond when clicking the respond button without firing onSelect", () => {
    const call = rttCallFactory.build({ id: "call-resp", status: "unassigned" })
    let selectCalled = false
    let respondCalled = false

    const { container } = render(
      <RttQueueItem
        call={call}
        tab="incoming"
        onSelect={() => (selectCalled = true)}
        onRespond={() => (respondCalled = true)}
      />
    )
    const view = within(container)

    fireEvent.click(view.getByRole("button", { name: /respond/i }))
    expect(respondCalled).toBe(true)
    expect(selectCalled).toBe(false)
  })
})
