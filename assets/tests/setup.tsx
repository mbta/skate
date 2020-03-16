// setup file
import { configure } from "enzyme"
import React from "react"
import Adapter from "enzyme-adapter-react-16"

configure({ adapter: new Adapter() })

jest.mock("react-tooltip", () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => <div className="mock-react-tooltip" />),
}))
