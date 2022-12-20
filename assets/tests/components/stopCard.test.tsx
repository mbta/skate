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

  test("renders connections", () => {
    const stop = stopFactory.build({
      connections: [{ type: 1, name: "Red", id: "Red" }],
    })

    render(<StopCard stop={stop} />)

    expect(
      screen.getByRole("list", { name: "Connections" })
    ).toBeInTheDocument()
  })

  test("sorts rendered connections", () => {
    const stop = stopFactory.build({
      connections: [
        { type: 3, name: "28", id: "28" },
        { type: 3, name: "SL1", id: "741" },
        { type: 3, name: "1", id: "1" },
        { type: 1, name: "Red", id: "Red" },
      ],
    })

    render(<StopCard stop={stop} />)

    const connectionItems = within(
      screen.getByRole("list", { name: "Connections" })
    ).getAllByRole("listitem")

    const connectionRoutes = connectionItems.map(
      (item) => item.children[0].innerHTML
    )

    expect(connectionRoutes).toEqual(["RL", "SL1", "1", "28"])
  })
})
