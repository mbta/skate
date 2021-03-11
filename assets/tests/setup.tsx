// mocking createSVGRect does some stuff that typescript doesn't like.
// @ts-nocheck
import { configure } from "enzyme"
import React from "react"
import Adapter from "enzyme-adapter-react-16"

configure({ adapter: new Adapter() })

jest.mock("react-leaflet-fullscreen", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock("@tippyjs/react", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((props) => (
    <div className="mock-tippy">
      <div className="mock-tippy-content">{props.content}</div>
      {props.children}
    </div>
  )),
}))

// JSDOM doesn't support part of SVG that's needed for Leaflet to run in tests.
// https://stackoverflow.com/questions/54382414/fixing-react-leaflet-testing-error-cannot-read-property-layeradd-of-null
const createElementNSOrig = document.createElementNS
// tslint:disable-next-line only-arrow-functions
document.createElementNS = function (namespaceURI, qualifiedName) {
  const element = createElementNSOrig.apply(this, arguments)
  if (
    namespaceURI === "http://www.w3.org/2000/svg" &&
    qualifiedName === "svg"
  ) {
    // tslint:disable-next-line no-empty
    element.createSVGRect = () => {}
  }
  return element
}
