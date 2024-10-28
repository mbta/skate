import { byRole } from "testing-library-selector"
export const streetViewModeSwitch = byRole("switch", { name: /Street View/ })

export const getAllStationIcons = (
  container: HTMLElement
): NodeListOf<Element> => {
  return container.querySelectorAll(".c-station-icon")
}

export const getAllStopIcons = (
  container: HTMLElement
): NodeListOf<Element> => {
  return container.querySelectorAll(".c-vehicle-map__stop")
}
