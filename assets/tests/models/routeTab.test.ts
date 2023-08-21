import { describe, test, expect } from "@jest/globals"
import {
  currentRouteTab,
  instantiatePresetByUUID,
  closeTabByUUID,
  highestExistingOrdering,
  isPreset,
  isEditedPreset,
  tabName,
  currentTabName,
  isOpenTab,
  applyRouteTabEdit,
  saveEditedPreset,
  deletePresetByUUID,
  findPresetByName,
  allOpenRouteIds,
  findFirstOpenTabWith,
  selectTabByUUID,
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

describe("isEditedPreset", () => {
  test("returns true for an edited preset", () => {
    const routeTab = routeTabFactory.build({
      presetName: "My Preset",
      ordering: 0,
      saveChangesToTabUuid: uuidv4(),
    })

    expect(isEditedPreset(routeTab)).toBeTruthy()
  })

  test("returns false for an open tab that is not a saved preset", () => {
    const routeTab = routeTabFactory.build({
      ordering: 0,
      presetName: "My Preset",
      saveChangesToTabUuid: undefined,
    })

    expect(isEditedPreset(routeTab)).toBeFalsy()
  })
})

describe("tabName", () => {
  test("tabName returns preset name of tab", () => {
    const routeTab = routeTabFactory.build({
      presetName: "My Preset",
    })
    expect(tabName(routeTab)).toEqual("My Preset")
  })

  test("tabName returns untitled if tab doesn't have a preset name", () => {
    const routeTab2 = routeTabFactory.build({})
    expect(tabName(routeTab2)).toEqual("Untitled")
  })
})

describe("currentTabName", () => {
  test("currentTabName returns preset name of current tab", () => {
    const routeTab1 = routeTabFactory.build({ presetName: "Not This One" })
    const routeTab2 = routeTabFactory.build({
      isCurrentTab: true,
      presetName: "This One",
    })

    expect(currentTabName([routeTab1, routeTab2])).toEqual("This One")
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

describe("selectTabByUUID", () => {
  test("selects the given tab and deselects others", () => {
    const routeTab1 = routeTabFactory.build()
    const routeTab2 = routeTabFactory.build({ isCurrentTab: true })

    const expectedNewTabs = [
      { ...routeTab1, isCurrentTab: true },
      { ...routeTab2, isCurrentTab: false },
    ]
    expect(selectTabByUUID([routeTab1, routeTab2], routeTab1.uuid)).toEqual(
      expectedNewTabs
    )
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
    expect(() => instantiatePresetByUUID([], "uuid1")).toThrow(
      new Error("No preset found for UUID uuid1")
    )
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
    expect(() => closeTabByUUID([], "uuid1")).toThrow(
      new Error("No preset found for UUID uuid1")
    )
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
    expect(() =>
      applyRouteTabEdit([], "uuid1", (routeTab) => routeTab)
    ).toThrow(new Error("No tab found for UUID uuid1"))
  })
})

describe("saveEditedPreset", () => {
  test("removes edited version of preset and overwrites original", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: undefined,
      isCurrentTab: false,
      presetName: "My Preset",
      selectedRouteIds: ["1"],
    })
    const routeTab2 = routeTabFactory.build({
      uuid: "uuid2",
      ordering: 0,
      isCurrentTab: true,
      presetName: "My Preset",
      selectedRouteIds: ["1", "39"],
      saveChangesToTabUuid: routeTab1.uuid,
    })
    const routeTab3 = routeTabFactory.build()

    const newRouteTabs = saveEditedPreset(
      [routeTab1, routeTab2, routeTab3],
      "uuid2"
    )

    expect(newRouteTabs.length).toBe(2)

    expect(newRouteTabs).toContainEqual({
      ...routeTab1,
      ordering: 0,
      isCurrentTab: true,
      selectedRouteIds: ["1", "39"],
    })

    expect(newRouteTabs).toContainEqual(routeTab3)
  })

  test("raises an error when no matching tab is found", () => {
    expect(() => saveEditedPreset([], "uuid1")).toThrow(
      new Error("No tab found for UUID uuid1")
    )
  })

  test("raises an error when tab by given UUID is not edited", () => {
    const routeTab = routeTabFactory.build({
      uuid: "uuid1",
      saveChangesToTabUuid: undefined,
    })
    expect(() => saveEditedPreset([routeTab], routeTab.uuid)).toThrow(
      new Error("Cannot save tab UUID uuid1: no saveChangesToTabUuid")
    )
  })
})

describe("deletePresetByUUID", () => {
  test("deletes preset", () => {
    const routeTab1 = routeTabFactory.build({
      presetName: "My Preset",
      ordering: undefined,
      isCurrentTab: false,
    })
    const routeTab2 = routeTabFactory.build({
      presetName: "My Other Preset",
      ordering: 0,
      isCurrentTab: true,
    })

    expect(deletePresetByUUID([routeTab1, routeTab2], routeTab1.uuid)).toEqual([
      routeTab2,
    ])
  })

  test("also closes open tab of preset", () => {
    const routeTab1 = routeTabFactory.build({
      presetName: "My Preset",
      ordering: 0,
      isCurrentTab: true,
    })
    const routeTab2 = routeTabFactory.build({
      presetName: "My Other Preset",
      ordering: 1,
      isCurrentTab: false,
    })

    expect(deletePresetByUUID([routeTab1, routeTab2], routeTab1.uuid)).toEqual([
      { ...routeTab2, isCurrentTab: true },
    ])
  })

  test("also closes open, edited tab of preset", () => {
    const routeTab1 = routeTabFactory.build({
      presetName: "My Preset",
      ordering: undefined,
      isCurrentTab: false,
    })
    const routeTab2 = routeTabFactory.build({
      presetName: "My Preset",
      ordering: 0,
      isCurrentTab: true,
      saveChangesToTabUuid: routeTab1.uuid,
    })
    const routeTab3 = routeTabFactory.build({
      presetName: "My Other Preset",
      ordering: 1,
      isCurrentTab: false,
    })

    expect(
      deletePresetByUUID([routeTab1, routeTab2, routeTab3], routeTab1.uuid)
    ).toEqual([{ ...routeTab3, isCurrentTab: true }])
  })
})

describe("findPresetByName", () => {
  test("returns match if found", () => {
    const routeTab2 = routeTabFactory.build({ presetName: "My Preset" })
    const routeTab1 = routeTabFactory.build({
      presetName: "My Preset",
      saveChangesToTabUuid: routeTab2.uuid,
    })

    expect(findPresetByName([routeTab1, routeTab2], "My Preset")).toBe(
      routeTab2
    )
  })

  test("returns undefined when name is not found", () => {
    const routeTab = routeTabFactory.build({ presetName: "Some Other Name" })

    expect(findPresetByName([routeTab], "My Preset")).toBeUndefined()
  })
})

describe("allOpenRouteIds", () => {
  test("returns unique route IDs from open tabs", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: true,
      selectedRouteIds: ["1", "2"],
    })
    const routeTab2 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: false,
      selectedRouteIds: ["2", "3"],
    })
    const routeTab3 = routeTabFactory.build({
      ordering: undefined,
      isCurrentTab: false,
      selectedRouteIds: ["3", "4"],
    })

    expect(allOpenRouteIds([routeTab1, routeTab2, routeTab3])).toEqual([
      "1",
      "2",
      "3",
    ])
  })
})

describe("findFirstOpenTabWith", () => {
  test("returns leftmost tab matching predicate", () => {
    const routeTab1 = routeTabFactory.build({
      ordering: 1,
      isCurrentTab: true,
      selectedRouteIds: ["1", "2"],
    })
    const routeTab2 = routeTabFactory.build({
      ordering: undefined,
      isCurrentTab: false,
      selectedRouteIds: ["2"],
    })
    const routeTab3 = routeTabFactory.build({
      ordering: 0,
      isCurrentTab: false,
      selectedRouteIds: ["2", "3"],
    })

    expect(
      findFirstOpenTabWith([routeTab1, routeTab2, routeTab3], (routeTab) =>
        routeTab.selectedRouteIds.includes("2")
      )
    ).toEqual(routeTab3)
  })

  test("returns null when no open route tab matching predicate is found", () => {
    const routeTab = routeTabFactory.build({
      ordering: undefined,
      isCurrentTab: false,
      selectedRouteIds: ["2"],
    })

    expect(
      findFirstOpenTabWith([routeTab], (rt) =>
        rt.selectedRouteIds.includes("2")
      )
    ).toBeNull()
  })
})
