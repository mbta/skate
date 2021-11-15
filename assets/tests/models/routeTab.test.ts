import { currentRouteTab } from "../../src/models/routeTab"
import routeTabFactory from "../factories/routeTab"

describe("currentRouteTab", () => {
  test("finds route tab flagges as current if present", () => {
    const routeTab1 = routeTabFactory.build()
    const routeTab2 = routeTabFactory.build({ isCurrentTab: true })

    expect(currentRouteTab([routeTab1, routeTab2])).toBe(routeTab2)
  })

  test("creates new route tab if no current tab found", () => {
    expect(currentRouteTab([])).toEqual(
      routeTabFactory.build({ isCurrentTab: true })
    )
  })
})
