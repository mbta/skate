import { expect } from "@jest/globals"
import { byRole } from "testing-library-selector"

export const reviewDetourButton = byRole("button", { name: "Review Detour" })
export const activateDetourButton = byRole("button", {
  name: "Activate Detour",
})
export const editDetourButton = byRole("button", { name: "Edit" })

export const viewDraftDetourHeading = byRole("heading", { name: "View Draft Detour" })
export const drawDetourHeading = byRole("heading", { name: "Draw Detour" })

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
  diverted: {
    getAll: (container: HTMLElement) =>
      container.querySelectorAll(
        ".c-detour_map--original-route-shape-diverted"
      ),
  },
  afterStartPoint: {
    interactive: {
      getAll: (container: HTMLElement) =>
        container.querySelectorAll(
          ".c-detour_map--original-route-shape-after-start-point--interactive"
        ),
    },
    not: {
      interactive: {
        getAll: (container: HTMLElement) =>
          container.querySelectorAll(
            ".c-detour_map--original-route-shape-after-start-point"
          ),
      },
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
