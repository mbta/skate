import { RunId } from "../realtime"

interface ShuttleRunSelectionBase {
  type: ShuttleRunSelectionType
}

interface RunIdShuttleRunSelection extends ShuttleRunSelectionBase {
  runId: RunId
}

interface FilterShuttleRunSelection extends ShuttleRunSelectionBase {
  filter: RegExp
}

export type ShuttleRunSelection =
  | RunIdShuttleRunSelection
  | FilterShuttleRunSelection

export enum ShuttleRunSelectionType {
  RunId = 1,
  Filter,
}

export function isRunIdShuttleRunSelection(
  shuttleRunSelection: ShuttleRunSelection
): shuttleRunSelection is RunIdShuttleRunSelection {
  return shuttleRunSelection.type === ShuttleRunSelectionType.RunId
}

const value = (shuttleRunSelection: ShuttleRunSelection): RunId | RegExp =>
  isRunIdShuttleRunSelection(shuttleRunSelection)
    ? shuttleRunSelection.runId
    : shuttleRunSelection.filter.toString()

export const isMatchingShuttleRunSelection = (
  a: ShuttleRunSelection,
  b: ShuttleRunSelection
): boolean => a.type === b.type && value(a) === value(b)

const runIdShuttleRunSelectionMatchesRunId = (
  runIdShuttleRunSelection: RunIdShuttleRunSelection,
  runId: RunId
): boolean => runIdShuttleRunSelection.runId === runId

const filterShuttleRunSelectionMatchesRunId = (
  { filter }: FilterShuttleRunSelection,
  runId: RunId
): boolean => runId.match(filter) !== null

export const matchesRunId = (
  shuttleRunSelection: ShuttleRunSelection,
  runId: RunId
): boolean =>
  isRunIdShuttleRunSelection(shuttleRunSelection)
    ? runIdShuttleRunSelectionMatchesRunId(shuttleRunSelection, runId)
    : filterShuttleRunSelectionMatchesRunId(shuttleRunSelection, runId)
