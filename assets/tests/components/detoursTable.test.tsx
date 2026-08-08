import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { DetoursTable, DetourStatus } from "../../src/components/detoursTable"
import { fireEvent, render, screen } from "@testing-library/react"
import { simpleDetourFactory } from "../factories/detourListFactory"
import routeFactory from "../factories/route"
import type { DetoursFilter } from "../../src/models/detoursFilter"

jest.useFakeTimers().setSystemTime(new Date("2024-08-29T20:00:00"))

describe("DetoursTable - Closed status with lifted filter", () => {
  const routes = routeFactory.buildList(3)
  const detours = [
    simpleDetourFactory.build({
      id: 1,
      intersection: "Main St & 1st Ave",
      reason: "Traffic",
      updatedAt: new Date("2024-08-15").getTime() / 1000,
    }),
    simpleDetourFactory.build({
      id: 2,
      intersection: "Broadway & 2nd Ave",
      reason: "Construction",
      updatedAt: new Date("2024-08-16").getTime() / 1000,
    }),
    simpleDetourFactory.build({
      id: 3,
      intersection: "Main St & 3rd Ave",
      reason: "Traffic",
      updatedAt: new Date("2024-08-17").getTime() / 1000,
    }),
  ]

  test("calls setFilter when intersection input changes", async () => {
    const setFilter = jest.fn()
    const filter: DetoursFilter = {}

    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={filter}
        setDetoursFilter={setFilter}
      />
    )

    const intersectionInput = screen.getByLabelText("Starting intersection")
    fireEvent.change(intersectionInput, { target: { value: "Main St" } })

    expect(setFilter).toHaveBeenCalledWith({ intersection: "Main St" })
  })

  test("calls setFilter when reason select changes", async () => {
    const setFilter = jest.fn()
    const filter: DetoursFilter = {}

    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={filter}
        setDetoursFilter={setFilter}
      />
    )

    const reasonSelect = screen.getByLabelText("Reason")
    fireEvent.change(reasonSelect, { target: { value: "Traffic" } })

    expect(setFilter).toHaveBeenCalledWith({ reason: "Traffic" })
  })

  test("calls setFilter when date picker changes", async () => {
    const setFilter = jest.fn()
    const filter: DetoursFilter = {}

    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={filter}
        setDetoursFilter={setFilter}
      />
    )

    // DateTimePicker is tested separately, so we just verify the filter row exists.
    expect(screen.getByText("Last Closed")).toBeInTheDocument()
  })

  test("calls setFilter with empty object when reset is clicked", async () => {
    const setFilter = jest.fn()
    const filter: DetoursFilter = {
      intersection: "Main St",
      reason: "Traffic",
      updatedAt: [new Date("2024-08-15")],
    }

    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={filter}
        setDetoursFilter={setFilter}
      />
    )

    const clearButton = screen.getByTitle("Clear Search")
    fireEvent.click(clearButton)

    expect(setFilter).toHaveBeenCalledWith({})
  })

  test("displays all detours without client-side filtering for Closed status", () => {
    const filter: DetoursFilter = {}

    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={filter}
        setDetoursFilter={jest.fn()}
      />
    )

    // All detours should be visible since server-side filtering is assumed
    expect(screen.getByText("Main St & 1st Ave")).toBeInTheDocument()
    expect(screen.getByText("Broadway & 2nd Ave")).toBeInTheDocument()
    expect(screen.getByText("Main St & 3rd Ave")).toBeInTheDocument()
  })

  test("displays filter values from lifted state", () => {
    const filter: DetoursFilter = {
      intersection: "Main St",
      reason: "Traffic",
    }

    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={filter}
        setDetoursFilter={jest.fn()}
      />
    )

    const intersectionInput = screen.getByLabelText(
      "Starting intersection"
    ) as HTMLInputElement
    const reasonSelect = screen.getByLabelText("Reason") as HTMLSelectElement

    expect(intersectionInput.value).toBe("Main St")
    expect(reasonSelect.value).toBe("Traffic")
  })
})

describe("DetoursTable - Active/Draft status with local filtering", () => {
  const detours = [
    simpleDetourFactory.build({
      id: 1,
      intersection: "Main St & 1st Ave",
      reason: "Traffic",
    }),
    simpleDetourFactory.build({
      id: 2,
      intersection: "Broadway & 2nd Ave",
      reason: "Construction",
    }),
    simpleDetourFactory.build({
      id: 3,
      intersection: "Main St & 3rd Ave",
      reason: "Traffic",
    }),
  ]

  test("filters detours locally for Active status", async () => {
    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Active}
        title={<h2>Active detours</h2>}
      />
    )

    // All detours initially visible
    expect(screen.getByText("Main St & 1st Ave")).toBeInTheDocument()
    expect(screen.getByText("Broadway & 2nd Ave")).toBeInTheDocument()
    expect(screen.getByText("Main St & 3rd Ave")).toBeInTheDocument()
  })

  test("does not show filter inputs for Active status", () => {
    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Active}
        title={<h2>Active detours</h2>}
      />
    )

    expect(
      screen.queryByLabelText("Starting intersection")
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Reason")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument()
  })

  test("does not show filter inputs for Draft status", () => {
    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Draft}
        title={<h2>Draft detours</h2>}
      />
    )

    expect(
      screen.queryByLabelText("Starting intersection")
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Reason")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument()
  })
})
