import { currentRouteTab } from "../../src/models/routeTab"
import routeTabFactory from "../factories/routeTab"

describe("currentRouteTab", () => {
  test("finds route tab flagged as current if present", () => {
    const routeTab1 = routeTabFactory.build()
    const routeTab2 = routeTabFactory.build({ isCurrentTab: true })

    expect(currentRouteTab([routeTab1, routeTab2])).toBe(routeTab2)
  })

  test("creates new route tab if no current tab found", () => {
    const routeTab = routeTabFactory.build({ isCurrentTab: true, ordering: 0 })
    delete routeTab.uuid

    expect(currentRouteTab([])).toMatchObject(routeTab)
  })
})
