import {
  currentRouteTab,
  instantiatePresetByUUID,
  closeTabByUUID,
  highestExistingOrdering,
  isPreset,
  isOpenTab,
  applyRouteTabEdit,
} from "../../src/models/routeTab"
import { v4 as uuidv4 } from "uuid"
import routeTabFactory from "../factories/routeTab"

describe("highestExistingOrdering", () => {
  test("returns highest ordering", () => {
    const routeTab1 = routeTabFactory.build({ ordering: 0 })
    const routeTab2 = routeTabFactory.build({ ordering: 1 })
    const routeTab3 = routeTabFactory.build({ ordering: undefined })

    expect(highestExistingOrdering([routeTab1, routeTab2, routeTab3])).toBe(1)
  })

  test("defaults to 0 when no tabs have ordering", () => {
    const routeTab = routeTabFactory.build({ ordering: undefined })

    expect(highestExistingOrdering([routeTab])).toBe(0)
  })

  test("defaults to -1 when no tabs are present", () => {
    expect(highestExistingOrdering([])).toBe(-1)
  })
})

describe("currentRouteTab", () => {
  test("finds route tab flagged as current if present", () => {
    const routeTab1 = routeTabFactory.build()
    const routeTab2 = routeTabFactory.build({ isCurrentTab: true })

    expect(currentRouteTab([routeTab1, routeTab2])).toBe(routeTab2)
  })

  test("returns undefined if no current tab found", () => {
    expect(currentRouteTab([])).toBeUndefined()
  })
})

describe("isPreset", () => {
  test("returns true for a saved preset", () => {
    const routeTab = routeTabFactory.build({
      presetName: "My Preset",
      ordering: undefined,
    })

    expect(isPreset(routeTab)).toBeTruthy()
  })

  test("returns false for an open tab that is not a saved preset", () => {
    const routeTab = routeTabFactory.build({
      presetName: undefined,
      ordering: 1,
    })

    expect(isPreset(routeTab)).toBeFalsy()
  })

  test("returns false for the edited version of a saved preset", () => {
    const routeTab = routeTabFactory.build({
      presetName: "My Preset",
      ordering: undefined,
      saveChangesToTabUuid: uuidv4(),
    })

    expect(isPreset(routeTab)).toBeFalsy()
  })
})

describe("isOpenTab", () => {
  test("returns false for a saved preset that isn't open", () => {
    const routeTab = routeTabFactory.build({
      presetName: "My Preset",
      ordering: undefined,
    })

    expect(isOpenTab(routeTab)).toBeFalsy()
  })

  test("returns true for an open tab that is not a saved preset", () => {
    const routeTab = routeTabFactory.build({
      presetName: undefined,
      ordering: 1,
    })

    expect(isOpenTab(routeTab)).toBeTruthy()
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

  test("when an edited version of the preset is already open, makes it the current tab", () => {
    const routeTab1 = routeTabFactory.build({
      uuid: "uuid1",
      ordering: undefined,
      isCurrentTab: false,
      selectedRouteIds: [],
    })
    const routeTab2 = routeTabFactory.build({
      ordering: 0,
      presetName: "Foo",
      isCurrentTab: false,
      saveChangesToTabUuid: routeTab1.uuid,
    })
    const routeTab3 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: true,
    })

    expect(
      instantiatePresetByUUID([routeTab1, routeTab2, routeTab3], "uuid1")
    ).toEqual([
      { ...routeTab1, isCurrentTab: false },
      { ...routeTab2, isCurrentTab: true },
      { ...routeTab3, isCurrentTab: false },
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

describe("applyRouteTabEdit", () => {
  test("applies changes to an unsaved open tab", () => {
    const routeTab = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      presetName: undefined,
      selectedRouteIds: [],
      saveChangesToTabUuid: undefined,
    })

    expect(
      applyRouteTabEdit([routeTab], routeTab.uuid, (tabToEdit) => {
        return { ...tabToEdit, selectedRouteIds: ["1"] }
      })
    ).toEqual([{ ...routeTab, selectedRouteIds: ["1"] }])
  })

  test("applies changes to an already-edited preset", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: undefined,
      isCurrentTab: false,
      presetName: "My Preset",
      selectedRouteIds: [],
      saveChangesToTabUuid: undefined,
    })
    const routeTab2 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      presetName: "My Preset",
      selectedRouteIds: [],
      saveChangesToTabUuid: routeTab1.uuid,
    })

    const newRouteTabs = applyRouteTabEdit(
      [routeTab1, routeTab2],
      routeTab2.uuid,
      (routeTab) => {
        return { ...routeTab, selectedRouteIds: ["1"] }
      }
    )

    expect(newRouteTabs.length).toBe(2)
    expect(newRouteTabs).toContainEqual({
      ...routeTab2,
      selectedRouteIds: ["1"],
    })
    expect(newRouteTabs).toContainEqual(routeTab1)
  })

  test("creates a new edited version of a preset", () => {
    const routeTab = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      presetName: "My Preset",
      selectedRouteIds: [],
      saveChangesToTabUuid: undefined,
    })
    const extraneousRouteTab = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: false,
      presetName: undefined,
      selectedRouteIds: [],
      saveChangesToTabUuid: undefined,
    })

    const newRouteTabs = applyRouteTabEdit(
      [routeTab, extraneousRouteTab],
      routeTab.uuid,
      (tabToEdit) => {
        return { ...tabToEdit, selectedRouteIds: ["1"] }
      }
    )

    expect(newRouteTabs.length).toBe(3)
    expect(
      newRouteTabs.find(
        (newRouteTab) =>
          newRouteTab.uuid !== routeTab.uuid &&
          newRouteTab.uuid !== extraneousRouteTab.uuid
      )
    ).toMatchObject({
      ordering: 0,
      isCurrentTab: true,
      selectedRouteIds: ["1"],
      saveChangesToTabUuid: routeTab.uuid,
    })
    expect(newRouteTabs).toContainEqual({
      ...routeTab,
      ordering: undefined,
      isCurrentTab: false,
    })
    expect(newRouteTabs).toContainEqual(extraneousRouteTab)
  })

  test("raises an error when no matching tab is found", () => {
    try {
      applyRouteTabEdit([], "uuid1", (routeTab) => routeTab)
      fail("did not raise an error")
    } catch (error) {
      expect(error).toEqual(new Error("No tab found for UUID uuid1"))
    }
  })
})
