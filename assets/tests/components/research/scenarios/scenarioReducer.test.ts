import { describe, test, expect } from "@jest/globals"
import {
  initialScenarioState,
  scenarioReducer,
} from "../../../../src/components/research/scenarios/scenarioReducer"
import { ScenarioState } from "../../../../src/components/research/scenarios/types"

describe("scenarioReducer", () => {
  test("initializes with default state", () => {
    expect(initialScenarioState).toEqual({
      activeScenarioId: null,
      isBroadcasting: false,
      error: null,
    })
  })

  test("TRIGGER_START sets isBroadcasting and clears previous error", () => {
    const errorState: ScenarioState = {
      activeScenarioId: null,
      isBroadcasting: false,
      error: "Previous error",
    }

    const state = scenarioReducer(errorState, {
      type: "TRIGGER_START",
      scenarioId: "scenario-1",
    })

    expect(state.isBroadcasting).toBe(true)
    expect(state.error).toBeNull()
  })

  test("TRIGGER_SUCCESS stores activeScenarioId and sets isBroadcasting to false", () => {
    const broadcastingState: ScenarioState = {
      activeScenarioId: null,
      isBroadcasting: true,
      error: null,
    }

    const state = scenarioReducer(broadcastingState, {
      type: "TRIGGER_SUCCESS",
      scenarioId: "scenario-2",
    })

    expect(state.activeScenarioId).toBe("scenario-2")
    expect(state.isBroadcasting).toBe(false)
    expect(state.error).toBeNull()
  })

  test("RESET_START sets isBroadcasting to true and clears error", () => {
    const activeState: ScenarioState = {
      activeScenarioId: "scenario-1",
      isBroadcasting: false,
      error: "Error",
    }

    const state = scenarioReducer(activeState, {
      type: "RESET_START",
    })

    expect(state.isBroadcasting).toBe(true)
    expect(state.error).toBeNull()
  })

  test("RESET_SUCCESS clears activeScenarioId and sets isBroadcasting to false", () => {
    const activeBroadcastingState: ScenarioState = {
      activeScenarioId: "scenario-1",
      isBroadcasting: true,
      error: null,
    }

    const state = scenarioReducer(activeBroadcastingState, {
      type: "RESET_SUCCESS",
    })

    expect(state.activeScenarioId).toBeNull()
    expect(state.isBroadcasting).toBe(false)
  })

  test("SET_ERROR sets error message and sets isBroadcasting to false", () => {
    const broadcastingState: ScenarioState = {
      activeScenarioId: null,
      isBroadcasting: true,
      error: null,
    }

    const state = scenarioReducer(broadcastingState, {
      type: "SET_ERROR",
      error: "Broadcast timed out",
    })

    expect(state.error).toBe("Broadcast timed out")
    expect(state.isBroadcasting).toBe(false)
  })
})
