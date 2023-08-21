import { jest, afterEach } from "@jest/globals"

// #region Mock HTMLElement for Leaflet
Object.defineProperties(HTMLElement.prototype, {
  clientWidth: {
    get: jest.fn(() => 0),
    set: jest.fn(),
    configurable: true,
  },
  clientHeight: {
    get: jest.fn(() => 0),
    set: jest.fn(),
    configurable: true,
  },
})

const clientHeight = jest.spyOn(HTMLElement.prototype, "clientHeight", "get")
const clientWidth = jest.spyOn(HTMLElement.prototype, "clientWidth", "get")

export function setHtmlDefaultWidthHeight(width: number, height: number) {
  return [
    clientWidth.mockReturnValue(width),
    clientHeight.mockReturnValue(height),
  ]
}

export function setHtmlWidthHeightForLeafletMap() {
  // Leaflet is trying to figure out the padding in screen space.
  // If this padding is larger than the reported client{Width|height} then
  // the size of the zoom it's trying to find will be negative which results in
  // failures from floating point math resulting in `Float.NaN` which propagates
  // down and causes issues elsewhere

  // the max padding we currently request is
  // 20 + 220, 50+20, so we at minimum need 220x70 from the padding.
  // setHtmlDefaultWidthHeight(240, 70)

  // jsdom defaults to 1024x768 and usually has the window sizes populated
  // setHtmlDefaultWidthHeight(1024, 768)
  setHtmlDefaultWidthHeight(window.innerWidth, window.innerHeight)
}

afterEach(() => {
  clientHeight.mockClear()
  clientWidth.mockClear()
})
//#endregion
