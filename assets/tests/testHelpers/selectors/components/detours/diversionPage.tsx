import { expect } from "@jest/globals"
import { byRole } from "testing-library-selector"

export const reviewDetourButton = byRole("button", { name: "Review Detour" })

export const originalRouteShape = {
  interactive: {
    getAll: (container: HTMLElement) =>
      container.querySelectorAll(".c-detour_map--original-route-shape"),
  },
  not: {
    interactive: {
      getAll: (container: HTMLElement) =>
        container.querySelectorAll(".c-detour_map--original-route-shape-core"),
    },
  },

  get(container: HTMLElement): Element {
    const maybeShape = container.querySelector(
      ".c-detour_map--original-route-shape"
    )
    // eslint-disable-next-line jest/no-standalone-expect
    expect(maybeShape).not.toBeNull()
    return maybeShape as Element
  },
}
