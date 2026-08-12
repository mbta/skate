import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { DetoursTable, DetourStatus } from "../../src/components/detoursTable"
import { fireEvent, render, screen } from "@testing-library/react"
import { simpleDetourFactory } from "../factories/detourListFactory"
import routeFactory from "../factories/route"
import type { DetoursFilter } from "../../src/models/detoursFilter"

const GLOBAL_DATE = new Date("2024-08-29T20:00:00")

jest.mock("../../src/components/dateTimePicker", () => ({
  DateTimePicker: ({
    options,
  }: {
    options: { onChange?: (dates: Date[]) => void }
  }) => (
    <button
      aria-label="Mock date picker"
      onClick={() =>
        options.onChange?.([GLOBAL_DATE])
      }
    >
      Pick date
    </button>
  ),
}))

jest.useFakeTimers().setSystemTime(GLOBAL_DATE)

describe("DetoursTable - Closed", () => {
  const routes = routeFactory.buildList(3)
  const expectedDate = GLOBAL_DATE
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

  const renderClosedTable = ({
    detoursFilter = {},
    setDetoursFilter = jest.fn(),
  }: {
    detoursFilter?: DetoursFilter
    setDetoursFilter?: jest.Mock
  } = {}) =>
    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={DetourStatus.Closed}
        title={<h2>Closed detours</h2>}
        routes={routes}
        routeId="all"
        setRouteId={jest.fn()}
        detoursFilter={detoursFilter}
        setDetoursFilter={setDetoursFilter}
      />
    )

  test.each([
    {
      name: "intersection input changes",
      detoursFilter: {} as DetoursFilter,
      interact: () => {
        const intersectionInput = screen.getByLabelText("Starting intersection")
        fireEvent.change(intersectionInput, { target: { value: "Main St" } })
      },
      expected: { intersection: "Main St" },
    },
    {
      name: "reason select changes",
      detoursFilter: {} as DetoursFilter,
      interact: () => {
        const reasonSelect = screen.getByLabelText("Reason")
        fireEvent.change(reasonSelect, { target: { value: "Traffic" } })
      },
      expected: { reason: "Traffic" },
    },
    {
      name: "date picker changes",
      detoursFilter: {} as DetoursFilter,
      interact: () => {
        fireEvent.click(screen.getByLabelText("Mock date picker"))
      },
      expected: { updatedAt: [expectedDate] },
    },
    {
      name: "reset is clicked",
      detoursFilter: {
        intersection: "Main St",
        reason: "Traffic",
        updatedAt: [new Date("2024-08-15")],
      },
      interact: () => {
        const clearButton = screen.getByTitle("Clear Search")
        fireEvent.click(clearButton)
      },
      expected: {},
    },
  ])("calls setFilter when $name", ({ detoursFilter, interact, expected }) => {
    const setFilter = jest.fn()

    renderClosedTable({ detoursFilter, setDetoursFilter: setFilter })

    interact()

    expect(setFilter).toHaveBeenCalledWith(expected)
  })

  test("displays all detours without client-side filtering for Closed status", () => {
    const filter: DetoursFilter = {}

    renderClosedTable({ detoursFilter: filter, setDetoursFilter: jest.fn() })

    // All detours should be visible since server-side filtering is assumed
    expect(screen.getByText("Main St & 1st Ave")).toBeInTheDocument()
    expect(screen.getByText("Broadway & 2nd Ave")).toBeInTheDocument()
    expect(screen.getByText("Main St & 3rd Ave")).toBeInTheDocument()
  })

  test("displays filter values from filter state", () => {
    const filter: DetoursFilter = {
      intersection: "Main St",
      reason: "Traffic",
    }

    renderClosedTable({ detoursFilter: filter, setDetoursFilter: jest.fn() })

    const intersectionInput = screen.getByLabelText<HTMLInputElement>("Starting intersection")!
    const reasonSelect = screen.getByLabelText("Reason") as HTMLSelectElement

    expect(intersectionInput.value).toBe("Main St")
    expect(reasonSelect.value).toBe("Traffic")
  })
})

describe("DetoursTable - Active/Draft status with local filtering", () => {
  const detours = [
    simpleDetourFactory.build({
      id: 1,
      status: "active",
      intersection: "Main St & 1st Ave",
      reason: "Traffic",
    }),
    simpleDetourFactory.build({
      id: 2,
      status: "active",
      intersection: "Broadway & 2nd Ave",
      reason: "Construction",
    }),
    simpleDetourFactory.build({
      id: 3,
      status: "active",
      intersection: "Main St & 3rd Ave",
      reason: "Traffic",
    }),
    simpleDetourFactory.build({
      id: 4,
      status: "draft",
      intersection: "Main St & 4th Ave",
      reason: "Traffic",
    }),
  ]

  test.each([
    {
      status: DetourStatus.Active,
      title: "Active detours",
    },
    {
      status: DetourStatus.Draft,
      title: "Draft detours",
    },
  ])("does not show filter inputs for $status status", ({ status, title }) => {
    render(
      <DetoursTable
        data={detours}
        onOpenDetour={jest.fn()}
        status={status}
        title={<h2>{title}</h2>}
      />
    )

    expect(
      screen.queryByLabelText("Starting intersection")
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Reason")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Clear" })
    ).not.toBeInTheDocument()
  })
})
