import { expect } from "@jest/globals"
import { byRole } from "testing-library-selector"

export const finishDetourButton = byRole("button", { name: "Finish Detour" })

const customSelector = (selector: string) => ({
  get(container: HTMLElement): Element {
    const maybeElement = container.querySelector(selector)

    expect(maybeElement).not.toBeNull()
    return maybeElement as Element
  },

  query(container: HTMLElement): Element | null {
    return container.querySelector(selector)
  },
})

export const originalRouteShape = customSelector(
  ".c-detour_map--original-route-shape"
)
export const divertedRouteShape = customSelector(
  ".c-detour_map--original-route-shape-diverted"
)
