import { jest, describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom/jest-globals"
import renderer from "react-test-renderer"
import RightPanel from "../../src/components/rightPanel"
import * as dateTime from "../../src/util/dateTime"

import ghostFactory from "../factories/ghost"
import vehicleFactory from "../factories/vehicle"
import { RunFactory } from "../factories/run"
import { OpenView } from "../../src/state/pagePanelState"

const ghost = ghostFactory.build({ runId: "ghostrun-1" })

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

describe("rightPanel", () => {
  test("shows nothing if nothing is selected", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <RightPanel openView={OpenView.None} />
        </BrowserRouter>
      )
      .toJSON()
    expect(tree).toEqual(null)
  })

  test("shows a selected vehicle", () => {
    const { id: runId } = RunFactory.build()
    const vehicle = vehicleFactory.build({ runId })

    const result = render(
      <RightPanel
        openView={OpenView.None}
        propertiesPanel={<button>{vehicle.runId!}</button>}
      />
    )

    expect(result.queryByRole("button", { name: vehicle.runId! })).toBeVisible()
  })

  test("shows a selected ghost", () => {
    const result = render(
      <RightPanel openView={OpenView.None} propertiesPanel={ghost.runId!} />
    )
    expect(result.queryByText(ghost.runId!)).toBeVisible()
  })

  test("shows notification drawer", () => {
    const result = render(<RightPanel openView={OpenView.NotificationDrawer} />)
    expect(result.getByText("Notifications")).toBeVisible()
  })

  test("prefers VPP to notification drawer", () => {
    const result = render(
      <RightPanel
        openView={OpenView.NotificationDrawer}
        propertiesPanel="Vehicles"
      />
    )
    expect(result.queryByText("Vehicles")).toBeVisible()
    expect(result.queryByText("Notifications")).toBeNull()
  })

  test("shows swings view", () => {
    const result = render(<RightPanel openView={OpenView.Swings} />)
    expect(result.queryByText("Swings")).toBeVisible()
  })

  test("prefers VPP to swings view", () => {
    const result = render(
      <RightPanel openView={OpenView.Swings} propertiesPanel="Vehicles" />
    )
    expect(result.queryByText("Vehicles")).toBeVisible()
    expect(result.queryByText("Swings")).toBeNull()
  })
})
