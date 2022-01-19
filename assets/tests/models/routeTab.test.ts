import {
  currentRouteTab,
  instantiatePresetFromTabs,
} from "../../src/models/routeTab"
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

describe("instantiatePresetFromTabs", () => {
  test("opens a preset with no empty current tab", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      selectedRouteIds: ["1"],
    })
    const routeTab2 = routeTabFactory.build({
      uuid: "uuid1",
      ordering: undefined,
      presetName: "Foo",
      isCurrentTab: false,
    })

    expect(instantiatePresetFromTabs([routeTab1, routeTab2], "uuid1")).toEqual([
      { ...routeTab1, isCurrentTab: false },
      { ...routeTab2, ordering: 1, isCurrentTab: true },
    ])
  })

  test("opens a preset when the current tab is empty", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      selectedRouteIds: [],
    })
    const routeTab2 = routeTabFactory.build({
      uuid: "uuid1",
      ordering: undefined,
      presetName: "Foo",
      isCurrentTab: false,
    })
    const routeTab3 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: false,
    })

    expect(
      instantiatePresetFromTabs([routeTab1, routeTab2, routeTab3], "uuid1")
    ).toEqual([{ ...routeTab2, ordering: 0, isCurrentTab: true }, routeTab3])
  })

  test("when the preset is already open, makes it the current tab", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      selectedRouteIds: [],
    })
    const routeTab2 = routeTabFactory.build({
      uuid: "uuid1",
      ordering: 1,
      presetName: "Foo",
      isCurrentTab: false,
    })

    expect(instantiatePresetFromTabs([routeTab1, routeTab2], "uuid1")).toEqual([
      { ...routeTab1, isCurrentTab: false },
      { ...routeTab2, isCurrentTab: true },
    ])
  })

  test("raises an error when no matching preset is found", () => {
    try {
      instantiatePresetFromTabs([], "uuid1")
      fail("did not raise an error")
    } catch (error) {
      expect(error).toEqual(new Error("No preset found for UUID uuid1"))
    }
  })
})
