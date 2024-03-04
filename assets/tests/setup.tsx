// mocking createSVGRect does some stuff that typescript doesn't like.
// @ts-nocheck
import failOnConsole from "jest-fail-on-console"
import React from "react"

failOnConsole()

jest.mock("@tippyjs/react", () => ({
  __esModule: true,
  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
  default: jest.fn().mockImplementation((props) => (
    <div className="mock-tippy" onClick={props.onShow}>
      <div className="mock-tippy-content">{props.content}</div>
      {props.children}
    </div>
  )),
  /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
}))

jest.mock("../src/hooks/useScreenSize", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => "desktop"),
}))

jest.mock("../src/hooks/useDeviceSupportsHover", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(true),
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

beforeEach(() => {
  // eslint-disable-next-line jest/no-standalone-expect
  expect.hasAssertions()
})
