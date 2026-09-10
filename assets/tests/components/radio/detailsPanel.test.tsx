import { describe, test, expect, afterEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, cleanup, within } from "@testing-library/react"
import { RttDetailsPanel } from "../../../src/components/radio/rtts/detailsPanel"
import { rttCallFactory } from "../../factories/radio/rtt"

describe("RttDetailsPanel", () => {
  afterEach(cleanup)

  test("renders placeholder message when call is null or undefined", () => {
    const { container } = render(<RttDetailsPanel call={null} />)
    const view = within(container)

    expect(
      view.getByText("Select a call from the queue to view details")
    ).toBeInTheDocument()
  })

  test.each([
    {
      operatorBadge: "12345",
      operatorName: "Jane Doe",
      expectedText: "#12345 Jane Doe",
      desc: "badge and name",
    },
    {
      operatorBadge: undefined,
      operatorName: "Jane Doe",
      expectedText: "Jane Doe",
      desc: "name only",
    },
    {
      operatorBadge: "12345",
      operatorName: undefined,
      expectedText: "#12345",
      desc: "badge only",
    },
    {
      operatorBadge: undefined,
      operatorName: undefined,
      expectedText: "N/A",
      desc: "neither",
    },
  ])(
    "formats operator display with $desc",
    ({ operatorBadge, operatorName, expectedText }) => {
      const call = rttCallFactory.build({
        operatorBadge,
        operatorName,
      })

      const { container } = render(<RttDetailsPanel call={call} />)
      const view = within(container)

      expect(view.getByText(expectedText)).toBeInTheDocument()
    }
  )

  test.each([
    {
      variant: "Custom Route Express",
      routeName: "1",
      direction: "Outbound",
      expectedHeadsign: "CUSTOM ROUTE EXPRESS",
      desc: "variant overrides route and direction",
    },
    {
      variant: undefined,
      routeName: "66",
      direction: "Inbound",
      expectedHeadsign: "66 INBOUND",
      desc: "falls back to routeName and direction",
    },
  ])(
    "formats headsign with $desc",
    ({ variant, routeName, direction, expectedHeadsign }) => {
      const call = rttCallFactory.build({
        variant,
        routeName,
        direction,
      })

      const { container } = render(<RttDetailsPanel call={call} />)
      const view = within(container)

      expect(view.getByText(expectedHeadsign)).toBeInTheDocument()
    }
  )

  test("displays live call tag, answered/markedDone timestamps, and triggers onMarkDone", () => {
    const answeredAt = new Date("2026-09-08T14:30:15Z")
    const markedDoneAt = new Date("2026-09-08T14:35:45Z")
    const call = rttCallFactory.build({
      status: "active",
      answeredAt,
      markedDoneAt,
    })
    let markDoneCalled = false

    const { container } = render(
      <RttDetailsPanel call={call} onMarkDone={() => (markDoneCalled = true)} />
    )
    const view = within(container)

    expect(view.getByText("Live Call")).toBeInTheDocument()
    expect(view.getByText("ANSWERED")).toBeInTheDocument()
    expect(view.getByText("MARKED DONE")).toBeInTheDocument()

    const markDoneBtn = view.getByRole("button", { name: /mark done/i })
    fireEvent.click(markDoneBtn)
    expect(markDoneCalled).toBe(true)
  })
})
