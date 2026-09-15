import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import { RttDetailsPanel } from "../../../../src/components/radio/rtts/detailsPanel"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("RttDetailsPanel", () => {
  test.each([
    { call: null, desc: "null" },
    { call: undefined, desc: "undefined" },
  ])("renders placeholder message when call is $desc", ({ call }) => {
    render(<RttDetailsPanel call={call} />)

    expect(
      screen.getByText("Select a call from the queue to view details")
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

      render(<RttDetailsPanel call={call} />)

      expect(screen.getByText(expectedText)).toBeInTheDocument()
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

      render(<RttDetailsPanel call={call} />)

      expect(screen.getByText(expectedHeadsign)).toBeInTheDocument()
    }
  )

  test("renders direction when present and omits direction container when absent", () => {
    const callWithDirection = rttCallFactory.build({
      direction: "Inbound",
    })
    const { unmount } = render(<RttDetailsPanel call={callWithDirection} />)
    expect(screen.getByText("INBOUND")).toBeInTheDocument()
    unmount()

    const callWithoutDirection = rttCallFactory.build({
      direction: undefined,
    })
    render(<RttDetailsPanel call={callWithoutDirection} />)
    expect(screen.queryByText("OUTBOUND")).not.toBeInTheDocument()
  })

  test("renders all detail key-value fields when present", () => {
    const call = rttCallFactory.build({
      currentLocation: "Forest Hills Station",
      runNumber: "101",
      garage: "Southampton",
      talkGroup: "OPS-1",
    })

    render(<RttDetailsPanel call={call} />)

    expect(screen.getByText("Forest Hills Station")).toBeInTheDocument()
    expect(screen.getByText("101")).toBeInTheDocument()
    expect(screen.getByText("Southampton")).toBeInTheDocument()
    expect(screen.getByText("OPS-1")).toBeInTheDocument()
  })

  test("falls back to default labels and omits optional fields when absent", () => {
    const call = rttCallFactory.build({
      currentLocation: undefined,
      runNumber: undefined,
      garage: undefined,
      talkGroup: undefined,
    })

    render(<RttDetailsPanel call={call} />)

    expect(screen.getByText("Unknown")).toBeInTheDocument()
    expect(screen.getByText("N/A")).toBeInTheDocument()
    expect(screen.queryByText("Garage")).not.toBeInTheDocument()
    expect(screen.queryByText("Talk Group")).not.toBeInTheDocument()
  })

  test("renders live indicator and formatted timestamps for an active call", () => {
    const answeredAt = new Date("2026-09-08T14:30:15Z")
    const markedDoneAt = new Date("2026-09-08T14:35:45Z")
    const call = rttCallFactory.build({
      status: "active",
      answeredAt,
      markedDoneAt,
    })

    render(<RttDetailsPanel call={call} />)

    expect(screen.getByText("Live Call")).toBeInTheDocument()
    expect(screen.getByText("ANSWERED")).toBeInTheDocument()
    expect(screen.getByText("MARKED DONE")).toBeInTheDocument()
  })

  test("fires onMarkDone with call when mark done button is clicked", () => {
    const call = rttCallFactory.build({ status: "active" })
    const onMarkDone = jest.fn()

    render(<RttDetailsPanel call={call} onMarkDone={onMarkDone} />)

    const markDoneBtn = screen.getByRole("button", { name: /mark done/i })
    fireEvent.click(markDoneBtn)

    expect(onMarkDone).toHaveBeenCalledTimes(1)
    expect(onMarkDone).toHaveBeenCalledWith(call)
  })
})
