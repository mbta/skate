// @ts-nocheck
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

// JSDOM doesn't support part of SVG that's needed for Leaflet to run in tests.
// https://stackoverflow.com/questions/54382414/fixing-react-leaflet-testing-error-cannot-read-property-layeradd-of-null
const createElementNSOrig = document.createElementNS
// tslint:disable-next-line only-arrow-functions
document.createElementNS = function (namespaceURI, qualifiedName) {
  if (
    namespaceURI === "http://www.w3.org/2000/svg" &&
    qualifiedName === "svg"
  ) {
    const element = createElementNSOrig.apply(this, arguments)
    // tslint:disable-next-line no-empty
    element.createSVGRect = () => {}
    return element
  }
  return createElementNSOrig.apply(this, arguments)
}
