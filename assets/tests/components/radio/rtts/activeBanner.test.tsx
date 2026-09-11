import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import { ActiveRttBanner } from "../../../../src/components/radio/rtts/activeBanner"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("ActiveRttBanner", () => {
  test("renders active banner region and fires onMarkDone with call when button clicked", () => {
    const call = rttCallFactory.build({
      vehicleId: "9876",
      callType: "Emergency",
    })
    const onMarkDone = jest.fn()

    render(<ActiveRttBanner activeCall={call} onMarkDone={onMarkDone} />)

    expect(
      screen.getByRole("region", { name: "Active Call Banner" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("ACTIVE EMERGENCY VEHICLE 9876")
    ).toBeInTheDocument()

    const markDoneBtn = screen.getByRole("button", { name: /mark done/i })
    fireEvent.click(markDoneBtn)

    expect(onMarkDone).toHaveBeenCalledTimes(1)
    expect(onMarkDone).toHaveBeenCalledWith(call)
  })

  test("renders banner text as static text when onSelectActive is not provided", () => {
    const call = rttCallFactory.build({
      vehicleId: "9876",
      callType: "RTT",
    })

    render(<ActiveRttBanner activeCall={call} onMarkDone={jest.fn()} />)

    expect(
      screen.queryByRole("button", { name: "ACTIVE RTT VEHICLE 9876" })
    ).not.toBeInTheDocument()
    expect(screen.getByText("ACTIVE RTT VEHICLE 9876")).toBeInTheDocument()
  })

  test("makes banner text a clickable button and fires onSelectActive with call when provided", () => {
    const call = rttCallFactory.build({
      vehicleId: "5432",
      callType: "PRTT",
    })
    const onSelectActive = jest.fn()

    render(
      <ActiveRttBanner
        activeCall={call}
        onMarkDone={jest.fn()}
        onSelectActive={onSelectActive}
      />
    )

    const selectBtn = screen.getByRole("button", {
      name: "ACTIVE PRTT VEHICLE 5432",
    })
    fireEvent.click(selectBtn)

    expect(onSelectActive).toHaveBeenCalledTimes(1)
    expect(onSelectActive).toHaveBeenCalledWith(call)
  })
})
