import { describe, test, expect } from "@jest/globals"
import {
  initialResearchScenarioState,
  researchScenarioReducer,
} from "../../../../src/components/research/scenarios/researchScenarioReducer"
import { ResearchScenarioState } from "../../../../src/components/research/scenarios/types"

describe("researchScenarioReducer", () => {
  test("initializes with default state", () => {
    expect(initialResearchScenarioState).toEqual({
      activeScenarioId: null,
      isBroadcasting: false,
      error: null,
    })
  })

  test("TRIGGER_START sets isBroadcasting and clears previous error", () => {
    const errorState: ResearchScenarioState = {
      activeScenarioId: null,
      isBroadcasting: false,
      error: "Previous error",
    }

    const state = researchScenarioReducer(errorState, {
      type: "TRIGGER_START",
      scenarioId: "scenario-1",
    })

    expect(state.isBroadcasting).toBe(true)
    expect(state.error).toBeNull()
  })

  test("TRIGGER_SUCCESS stores activeScenarioId and sets isBroadcasting to false", () => {
    const broadcastingState: ResearchScenarioState = {
      activeScenarioId: null,
      isBroadcasting: true,
      error: null,
    }

    const state = researchScenarioReducer(broadcastingState, {
      type: "TRIGGER_SUCCESS",
      scenarioId: "scenario-2",
    })

    expect(state.activeScenarioId).toBe("scenario-2")
    expect(state.isBroadcasting).toBe(false)
    expect(state.error).toBeNull()
  })

  test("RESET_START sets isBroadcasting to true and clears error", () => {
    const activeState: ResearchScenarioState = {
      activeScenarioId: "scenario-1",
      isBroadcasting: false,
      error: "Error",
    }

    const state = researchScenarioReducer(activeState, {
      type: "RESET_START",
    })

    expect(state.isBroadcasting).toBe(true)
    expect(state.error).toBeNull()
  })

  test("RESET_SUCCESS clears activeScenarioId and sets isBroadcasting to false", () => {
    const activeBroadcastingState: ResearchScenarioState = {
      activeScenarioId: "scenario-1",
      isBroadcasting: true,
      error: null,
    }

    const state = researchScenarioReducer(activeBroadcastingState, {
      type: "RESET_SUCCESS",
    })

    expect(state.activeScenarioId).toBeNull()
    expect(state.isBroadcasting).toBe(false)
  })

  test("SET_ERROR sets error message and sets isBroadcasting to false", () => {
    const broadcastingState: ResearchScenarioState = {
      activeScenarioId: null,
      isBroadcasting: true,
      error: null,
    }

    const state = researchScenarioReducer(broadcastingState, {
      type: "SET_ERROR",
      error: "Broadcast timed out",
    })

    expect(state.error).toBe("Broadcast timed out")
    expect(state.isBroadcasting).toBe(false)
  })
})
