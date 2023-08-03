import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { within } from "@testing-library/dom"
import StopCard from "../../src/components/stopCard"
import stopFactory from "../factories/stop"

jest.mock("react-leaflet", () => ({
  __esModule: true,
  Popup: jest.fn().mockImplementation(({ children }) => <div>{children}</div>),
}))

describe("StopCard", () => {
  test("doesn't render connections when none are present", () => {
    const stop = stopFactory.build()

    render(<StopCard stop={stop} />)

    expect(
      screen.queryByRole("list", { name: "Connections" })
    ).not.toBeInTheDocument()
  })

  test("doesn't render routes when none are present", () => {
    const stop = stopFactory.build()

    render(<StopCard stop={stop} />)

    expect(
      screen.queryByRole("list", { name: "Routes" })
    ).not.toBeInTheDocument()
  })

  test("doesn't render direction when none is present", () => {
    const stop = stopFactory.build()

    render(<StopCard stop={stop} />)

    expect(screen.queryByText(/Inbound/)).not.toBeInTheDocument()

    expect(screen.queryByText(/Outbound/)).not.toBeInTheDocument()
  })

  test("render inbound direction", () => {
    const stop = stopFactory.build()

    render(<StopCard stop={stop} direction={1} />)

    expect(screen.getByText(/Inbound/)).toBeInTheDocument()
  })

  test("render outbound direction", () => {
    const stop = stopFactory.build()

    render(<StopCard stop={stop} direction={0} />)

    expect(screen.getByText(/Outbound/)).toBeInTheDocument()
  })

  test("when routes aren't present but connections are, renders connections", () => {
    const stop = stopFactory.build({
      connections: [{ type: 1, name: "Red", id: "Red" }],
    })

    render(<StopCard stop={stop} />)

    expect(
      screen.getByRole("list", { name: "Connections" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("list", { name: "Routes" })
    ).not.toBeInTheDocument()
  })

  test("when routes are present, renders the routes", () => {
    const stop = stopFactory.build({
      routes: [{ type: 1, name: "Red", id: "Red" }],
      connections: [{ type: 1, name: "Blue", id: "Blue" }],
    })

    render(<StopCard stop={stop} />)

    expect(screen.getByRole("list", { name: "Routes" })).toBeInTheDocument()
    expect(
      screen.getAllByRole("listitem").find((item) => item.textContent === "Red")
    ).toBeInTheDocument()

    expect(
      screen.queryByRole("list", { name: "Connections" })
    ).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole("listitem")
        .find((item) => item.textContent === "Blue")
    ).toBeUndefined()
  })

  test("sorts rendered connections and excludes commuter rail", () => {
    const stop = stopFactory.build({
      connections: [
        { type: 1, name: "Orange Line", id: "Orange" },
        { type: 3, name: "CT3", id: "708" },
        { type: 3, name: "28", id: "28" },
        { type: 3, name: "SL1", id: "741" },
        { type: 3, name: "1", id: "1" },
        { type: 2, name: "Providence/Stoughton Line", id: "CR-Providence" },
        { type: 3, name: "CT2", id: "747" },
        { type: 1, name: "Red Line", id: "Red" },
      ],
    })

    render(<StopCard stop={stop} />)

    const connectionItems = within(
      screen.getByRole("list", { name: "Connections" })
    ).getAllByRole("listitem")

    const connectionRoutes = connectionItems.map(
      (item) => item.children[0].innerHTML
    )

    expect(connectionRoutes).toEqual([
      "OL",
      "RL",
      "SL1",
      "CT2",
      "CT3",
      "1",
      "28",
    ])
  })
})
