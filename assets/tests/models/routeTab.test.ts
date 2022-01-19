import {
  currentRouteTab,
  instantiatePresetByUUID,
  closeTabByUUID,
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

describe("instantiatePresetByUUID", () => {
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

    expect(instantiatePresetByUUID([routeTab1, routeTab2], "uuid1")).toEqual([
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
      instantiatePresetByUUID([routeTab1, routeTab2, routeTab3], "uuid1")
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

    expect(instantiatePresetByUUID([routeTab1, routeTab2], "uuid1")).toEqual([
      { ...routeTab1, isCurrentTab: false },
      { ...routeTab2, isCurrentTab: true },
    ])
  })

  test("raises an error when no matching preset is found", () => {
    try {
      instantiatePresetByUUID([], "uuid1")
      fail("did not raise an error")
    } catch (error) {
      expect(error).toEqual(new Error("No preset found for UUID uuid1"))
    }
  })
})

describe("closeTabByUUID", () => {
  test("when closing a tab not saved as a preset, deletes it entirely", () => {
    const routeTab1 = routeTabFactory.build({
      presetName: undefined,
      isCurrentTab: false,
      ordering: 0,
    })
    const routeTab2 = routeTabFactory.build({
      presetName: undefined,
      isCurrentTab: true,
      ordering: 1,
    })

    expect(closeTabByUUID([routeTab1, routeTab2], routeTab1.uuid)).toEqual([
      routeTab2,
    ])
  })

  test("when closing a tab saved as a preset, keeps it in list", () => {
    const routeTab1 = routeTabFactory.build({
      presetName: "Foo",
      ordering: 0,
      isCurrentTab: true,
    })
    const routeTab2 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: false,
    })

    expect(closeTabByUUID([routeTab1, routeTab2], routeTab1.uuid)).toEqual([
      { ...routeTab1, ordering: undefined, isCurrentTab: false },
      { ...routeTab2, isCurrentTab: true },
    ])
  })

  test("handles cases when closing current tab", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
    })
    const routeTab2 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: false,
    })
    const routeTab3 = routeTabFactory.build({
      ordering: 2,
      isCurrentTab: false,
    })

    expect(
      closeTabByUUID([routeTab1, routeTab2, routeTab3], routeTab1.uuid)
    ).toEqual([{ ...routeTab2, isCurrentTab: true }, routeTab3])

    const routeTab4 = routeTabFactory.build({
      ordering: 2,
      isCurrentTab: true,
    })
    const routeTab5 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: false,
    })
    const routeTab6 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: false,
    })

    expect(
      closeTabByUUID([routeTab4, routeTab5, routeTab6], routeTab4.uuid)
    ).toEqual([{ ...routeTab5, isCurrentTab: true }, routeTab6])
  })

  test("raises an error when no matching tab is found", () => {
    try {
      closeTabByUUID([], "uuid1")
      fail("did not raise an error")
    } catch (error) {
      expect(error).toEqual(new Error("No preset found for UUID uuid1"))
    }
  })
})
