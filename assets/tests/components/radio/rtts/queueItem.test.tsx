import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import { RttQueueItem } from "../../../../src/components/radio/rtts/queueItem"
import { rttCallFactory } from "../../../factories/radio/rtt"
import { RttCallType } from "../../../../src/components/radio/rtts/types"

describe("RttQueueItem", () => {
  test.each(["Emergency", "PRTT", "RTT"] as RttCallType[])(
    "renders call type badge for %s call",
    (callType) => {
      const call = rttCallFactory.build({ callType, vehicleId: "1234" })
      render(<RttQueueItem call={call} />)

      expect(screen.getByText(callType)).toBeInTheDocument()
      expect(
        screen.getByRole("button", {
          name: `Select ${callType} call for vehicle 1234`,
        })
      ).toBeInTheDocument()
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

      render(
        <RttQueueItem
          call={call}
          tab="incoming"
          currentDispatcherName={currentDispatcherName}
        />
      )

      expect(screen.getByText(expectedName)).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /respond/i })
      ).not.toBeInTheDocument()
    }
  )

  test("hides action button on past tab", () => {
    const call = rttCallFactory.build({ status: "done" })
    render(<RttQueueItem call={call} tab="past" />)

    expect(
      screen.queryByRole("button", { name: /respond/i })
    ).not.toBeInTheDocument()
  })

  test.each([
    { isSelected: true, pressed: true },
    { isSelected: false, pressed: false },
  ])(
    "renders row toggle button with pressed=$pressed when isSelected=$isSelected",
    ({ isSelected, pressed }) => {
      const call = rttCallFactory.build({
        callType: "Emergency",
        vehicleId: "1234",
      })

      render(<RttQueueItem call={call} isSelected={isSelected} />)

      expect(
        screen.getByRole("button", {
          name: "Select Emergency call for vehicle 1234",
          pressed,
        })
      ).toBeInTheDocument()
    }
  )

  test("triggers onSelect with call when clicking the row", () => {
    const call = rttCallFactory.build({
      id: "call-click",
      vehicleId: "1234",
      callType: "Emergency",
    })
    const onSelect = jest.fn()

    render(<RttQueueItem call={call} onSelect={onSelect} />)

    const rowButton = screen.getByRole("button", {
      name: "Select Emergency call for vehicle 1234",
    })
    fireEvent.click(rowButton)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(call)
  })

  test.each(["Enter", " "])(
    "triggers onSelect with call on keyboard %s key",
    (key) => {
      const call = rttCallFactory.build({
        id: `call-kb-${key}`,
        vehicleId: "1234",
        callType: "PRTT",
      })
      const onSelect = jest.fn()

      render(<RttQueueItem call={call} onSelect={onSelect} />)

      const rowButton = screen.getByRole("button", {
        name: "Select PRTT call for vehicle 1234",
      })
      fireEvent.keyDown(rowButton, { key })

      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(call)
    }
  )

  test("triggers onRespond when clicking the respond button without firing onSelect", () => {
    const call = rttCallFactory.build({ id: "call-resp", status: "unassigned" })
    const onSelect = jest.fn()
    const onRespond = jest.fn()

    render(
      <RttQueueItem
        call={call}
        tab="incoming"
        onSelect={onSelect}
        onRespond={onRespond}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /respond/i }))

    expect(onRespond).toHaveBeenCalledTimes(1)
    expect(onRespond).toHaveBeenCalledWith(call)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
