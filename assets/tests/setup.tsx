// mocking createSVGRect does some stuff that typescript doesn't like.
// @ts-nocheck
import React from "react"

jest.mock("@tippyjs/react", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((props) => (
    <div className="mock-tippy">
      <div className="mock-tippy-content">{props.content}</div>
      {props.children}
    </div>
  )),
}))

jest.mock("../src/hooks/useDeviceType", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => "desktop"),
}))

// JSDOM doesn't support part of SVG that's needed for Leaflet to run in tests.
// https://stackoverflow.com/questions/54382414/fixing-react-leaflet-testing-error-cannot-read-property-layeradd-of-null
const createElementNSOrig = document.createElementNS
document.createElementNS = function (namespaceURI, qualifiedName) {
  const element = createElementNSOrig.apply(this, arguments)
  if (
    namespaceURI === "http://www.w3.org/2000/svg" &&
    qualifiedName === "svg"
  ) {
    element.createSVGRect = () => {}
  }
  return element
}
