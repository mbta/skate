import { emptySearchQuery } from "../../src/models/searchQuery"
import {
  addSavedQuery,
  initialSearchPageState,
  reducer,
  SearchPageState,
  setSearchProperty,
  setSearchText,
  submitSearch,
  SelectedEntityType,
  setSelectedEntity,
  newSearchSession,
  SelectedEntity,
  goBack,
} from "../../src/state/searchPageState"
import { searchPageStateFactory } from "../factories/searchPageState"

describe("initialSearchPageState", () => {
  test("sets text to empty string", () => {
    expect(initialSearchPageState.query.text).toEqual("")
  })

  test("sets property to 'all'", () => {
    expect(initialSearchPageState.query.property).toEqual("all")
  })
})

describe("reducer", () => {
  test("setSearchText allows you to set text", () => {
    const newSearch = reducer(initialSearchPageState, setSearchText("new text"))

    expect(newSearch.query.text).toEqual("new text")
  })

  test("setSearchText sets isActive to false", () => {
    const activeSearch = {
      ...initialSearchPageState,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchText("new text"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("setSearchProperty allows you to set property", () => {
    const newSearch = reducer(initialSearchPageState, setSearchProperty("run"))

    expect(newSearch.query.property).toEqual("run")
  })

  test("setSearchProperty sets isActive to false", () => {
    const activeSearch = {
      ...initialSearchPageState,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchProperty("run"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch sets isActive to true if the query is valid", () => {
    const validQuery: SearchPageState = searchPageStateFactory.build({
      query: { text: "12", property: "run" },
      isActive: false,
    })
    const newSearch = reducer(validQuery, submitSearch())

    expect(newSearch.isActive).toEqual(true)
  })

  test("submitSearch does not set isActive to true if the query is invalid", () => {
    const invalidQuery: SearchPageState = searchPageStateFactory.build({
      query: { text: "1", property: "run" },
      isActive: false,
    })
    const newSearch = reducer(invalidQuery, submitSearch())

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch saves the query if it's valid", () => {
    const validQuery: SearchPageState = searchPageStateFactory.build({
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    })
    const newSearch = reducer(validQuery, submitSearch())

    expect(newSearch.savedQueries).toEqual([{ text: "12" }])
  })

  test("submitSearch does not save the query if it's not valid", () => {
    const invalidQuery: SearchPageState = searchPageStateFactory.build({
      query: { text: "1", property: "run" },
      isActive: false,
      savedQueries: [],
    })
    const newSearch = reducer(invalidQuery, submitSearch())

    expect(newSearch.savedQueries).toEqual([])
  })

  describe("newSearchSession", () => {
    test("resets the search query and clears the selectedEntity + history", () => {
      const oldState: SearchPageState = searchPageStateFactory.build({
        query: { text: "12", property: "run" },
        isActive: true,
        selectedEntity: { type: SelectedEntityType.Vehicle, vehicleId: "4567" },
        selectedEntityHistory: [
          { type: SelectedEntityType.Vehicle, vehicleId: "1234" },
        ],
      })
      const newState = reducer(oldState, newSearchSession())

      expect(newState.isActive).toEqual(false)
      expect(newState.query).toEqual(emptySearchQuery)
      expect(newState.selectedEntity).toBeNull()
      expect(newState.selectedEntityHistory).toEqual([])
    })

    test("when  newSearchSession is called with a selection, resets the search query and history, but sets new selectedEntity", () => {
      const oldState: SearchPageState = searchPageStateFactory.build({
        query: { text: "12", property: "run" },
        isActive: true,
        selectedEntity: { type: SelectedEntityType.Vehicle, vehicleId: "4567" },
        selectedEntityHistory: [
          { type: SelectedEntityType.Vehicle, vehicleId: "1234" },
        ],
      })

      const newVehicle: SelectedEntity = {
        type: SelectedEntityType.Vehicle,
        vehicleId: "new_vehicle",
      }

      const newState = reducer(oldState, newSearchSession(newVehicle))

      expect(newState.isActive).toEqual(false)
      expect(newState.query).toEqual(emptySearchQuery)
      expect(newState.selectedEntity).toEqual(newVehicle)

      expect(newState.selectedEntityHistory).toEqual([])
    })
  })

  describe("setSelectedEntity", () => {
    test("can set to null", () => {
      const initialState: SearchPageState = {
        ...initialSearchPageState,
        selectedEntity: { type: SelectedEntityType.Vehicle, vehicleId: "123" },
      }

      const updatedState = reducer(initialState, setSelectedEntity(null))
      expect(updatedState.selectedEntity).toBeNull()
    })

    test("can set to vehicle", () => {
      const initialState: SearchPageState = {
        ...initialSearchPageState,
      }

      const updatedState = reducer(
        initialState,
        setSelectedEntity({
          type: SelectedEntityType.Vehicle,
          vehicleId: "123",
        })
      )
      expect(updatedState.selectedEntity).toEqual({
        type: SelectedEntityType.Vehicle,
        vehicleId: "123",
      })
    })

    test("can set to route", () => {
      const initialState: SearchPageState = {
        ...initialSearchPageState,
      }

      const updatedState = reducer(
        initialState,
        setSelectedEntity({
          type: SelectedEntityType.RoutePattern,
          routeId: "66",
          routePatternId: "66-_-0",
        })
      )
      expect(updatedState.selectedEntity).toEqual({
        type: SelectedEntityType.RoutePattern,
        routeId: "66",
        routePatternId: "66-_-0",
      })
    })

    test("when there isn't already a selectedEntity, setting a new one doesn't change the history", () => {
      const initialState = searchPageStateFactory.build()

      const updatedState = reducer(
        initialState,
        setSelectedEntity({
          type: SelectedEntityType.Vehicle,
          vehicleId: "456",
        })
      )
      expect(updatedState.selectedEntityHistory).toEqual([])
    })

    test("when there is already a selectedEntity, setting a new selection adds the old one to the history", () => {
      const firstSelection = {
        type: SelectedEntityType.Vehicle,
        vehicleId: "123",
      }
      const initialState = searchPageStateFactory.build({
        selectedEntity: firstSelection,
      })

      const updatedState = reducer(
        initialState,
        setSelectedEntity({
          type: SelectedEntityType.Vehicle,
          vehicleId: "456",
        })
      )
      expect(updatedState.selectedEntityHistory).toEqual([firstSelection])
    })
  })

  describe("goBack", () => {
    test("when there is no selectedEntity or history, doesn't change selectedEntity or history", () => {
      const updatedState = reducer(initialSearchPageState, goBack())
      expect(updatedState.selectedEntity).toBeNull()
      expect(updatedState.selectedEntityHistory).toEqual([])
    })

    test("when there is a selectedEnitity but no history, selectedEntity becomes null", () => {
      const initialState = searchPageStateFactory.build({
        selectedEntity: {
          type: SelectedEntityType.Vehicle,
          vehicleId: "123",
        },
      })
      const updatedState = reducer(initialState, goBack())
      expect(updatedState.selectedEntity).toBeNull()
      expect(updatedState.selectedEntityHistory).toEqual([])
    })

    test("when called repeatedly, sets the selectedEntity and removes items from the history in the expected order", () => {
      const firstSelection: SelectedEntity = {
        type: SelectedEntityType.Vehicle,
        vehicleId: "123",
      }
      const secondSelection: SelectedEntity = {
        type: SelectedEntityType.RoutePattern,
        routeId: "66",
        routePatternId: "66_1",
      }
      const thirdSelection: SelectedEntity = {
        type: SelectedEntityType.Vehicle,
        vehicleId: "456",
      }
      const initialState = searchPageStateFactory.build()
      let updatedState = reducer(
        initialState,
        setSelectedEntity(firstSelection)
      )
      updatedState = reducer(updatedState, setSelectedEntity(secondSelection))
      updatedState = reducer(updatedState, setSelectedEntity(thirdSelection))

      expect(updatedState.selectedEntity).toBe(thirdSelection)
      expect(updatedState.selectedEntityHistory).toHaveLength(2)

      updatedState = reducer(updatedState, goBack())
      expect(updatedState.selectedEntity).toBe(secondSelection)
      expect(updatedState.selectedEntityHistory).toHaveLength(1)

      updatedState = reducer(updatedState, goBack())
      expect(updatedState.selectedEntity).toBe(firstSelection)
      expect(updatedState.selectedEntityHistory).toHaveLength(0)

      updatedState = reducer(updatedState, goBack())
      expect(updatedState.selectedEntity).toBeNull()
      expect(updatedState.selectedEntityHistory).toHaveLength(0)
    })
  })
})

describe("addSavedQuery", () => {
  test("can save a first query", () => {
    expect(addSavedQuery([], { text: "a" })).toEqual([{ text: "a" }])
  })

  test("can save subsequent queries", () => {
    expect(addSavedQuery([{ text: "a" }], { text: "b" })).toEqual([
      { text: "b" },
      { text: "a" },
    ])
  })

  test("if there are duplicates, drops the old query", () => {
    expect(
      addSavedQuery([{ text: "b" }, { text: "a" }], { text: "a" })
    ).toEqual([{ text: "a" }, { text: "b" }])
  })

  test("caps at 10 saved queries", () => {
    expect(
      addSavedQuery(
        [
          { text: "j" },
          { text: "i" },
          { text: "h" },
          { text: "g" },
          { text: "f" },
          { text: "e" },
          { text: "d" },
          { text: "c" },
          { text: "b" },
          { text: "a" },
        ],
        { text: "k" }
      )
    ).toEqual([
      { text: "k" },
      { text: "j" },
      { text: "i" },
      { text: "h" },
      { text: "g" },
      { text: "f" },
      { text: "e" },
      { text: "d" },
      { text: "c" },
      { text: "b" },
    ])
  })
})
