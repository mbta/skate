import { describe, test, expect, afterEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, cleanup, within } from "@testing-library/react"
import { ActiveRttBanner } from "../../../../src/components/radio/rtts/activeBanner"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("ActiveRttBanner", () => {
  afterEach(cleanup)

  test("renders vehicle banner text and fires onMarkDone when button clicked", () => {
    const call = rttCallFactory.build({ vehicleId: "9876" })
    let markDoneCalled = false

    const { container } = render(
      <ActiveRttBanner
        activeCall={call}
        onMarkDone={() => (markDoneCalled = true)}
      />
    )
    const view = within(container)

    expect(view.getByText("ACTIVE CALL VEHICLE 9876")).toBeInTheDocument()

    const markDoneBtn = view.getByRole("button", { name: /mark done/i })
    fireEvent.click(markDoneBtn)
    expect(markDoneCalled).toBe(true)
  })

  test("makes banner text a clickable button when onSelectActive is provided", () => {
    const call = rttCallFactory.build({ vehicleId: "5432" })
    let selectedCall: typeof call | null = null

    const { container } = render(
      <ActiveRttBanner
        activeCall={call}
        onMarkDone={() => {}}
        onSelectActive={(c) => (selectedCall = c)}
      />
    )
    const view = within(container)

    const selectBtn = view.getByRole("button", {
      name: "ACTIVE CALL VEHICLE 5432",
    })
    fireEvent.click(selectBtn)
    expect(selectedCall).toEqual(call)
  })
})
