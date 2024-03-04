import { expect } from "@jest/globals"
import { byRole } from "testing-library-selector"

export const finishDetourButton = byRole("button", { name: "Finish Detour" })

export const originalRouteShape = {
  get(container: HTMLElement): Element {
    const maybeShape = container.querySelector(
      ".c-detour_map--original-route-shape"
    )
    // eslint-disable-next-line jest/no-standalone-expect
    expect(maybeShape).not.toBeNull()
    return maybeShape as Element
  },
}
