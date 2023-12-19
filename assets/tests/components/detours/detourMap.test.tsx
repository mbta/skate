import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import React from "react"
import { DetourMap } from "../../../src/components/detours/detourMap"
import { routePatternFactory } from "../../factories/routePattern"
import userEvent from "@testing-library/user-event"

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

describe("DetourMap", () => {
  test("can click on route shape to start detour", async () => {
    const { container } = render(
      <DetourMap routePattern={routePatternFactory.build()} />
    )

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("can click on route shape again to end detour", async () => {
    const { container } = render(
      <DetourMap routePattern={routePatternFactory.build()} />
    )

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour End")).not.toBeNull()
  })
})
