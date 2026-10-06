export interface ResearchScenario<T = unknown, Id extends string = string> {
  id: Id
  name: string
  description?: string
  data?: T
}

export interface ResearchScenarioState<Id extends string = string> {
  activeScenarioId: Id | null
  isBroadcasting: boolean
  error: string | null
}

export type ResearchScenarioAction<Id extends string = string> =
  | { type: "TRIGGER_START"; scenarioId: Id }
  | { type: "TRIGGER_SUCCESS"; scenarioId: Id }
  | { type: "RESET_START" }
  | { type: "RESET_SUCCESS" }
  | { type: "SET_ERROR"; error: string }
