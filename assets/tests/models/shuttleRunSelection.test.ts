import {
  isMatchingShuttleRunSelection,
  isRunIdShuttleRunSelection,
  matchesRunId,
  ShuttleRunSelection,
  ShuttleRunSelectionType,
} from "../../src/models/shuttleRunSelection"

describe("isRunIdShuttleRunSelection", () => {
  test("returns true if this is a RunIdShuttleRunSelection", () => {
    const runIdShuttleRunSelection: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      runId: "1",
    }

    expect(isRunIdShuttleRunSelection(runIdShuttleRunSelection)).toBeTruthy()
  })

  test("returns false if this is a FilterShuttleRunSelection", () => {
    const filterShuttleRunSelection: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter: /999.*/,
    }

    expect(isRunIdShuttleRunSelection(filterShuttleRunSelection)).toBeFalsy()
  })
})

describe("isMatchingShuttleRunSelection", () => {
  test("returns true if they are the same RunIdShuttleRunSelection", () => {
    const a: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      runId: "1",
    }
    const b: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      runId: "1",
    }

    expect(isMatchingShuttleRunSelection(a, b)).toBeTruthy()
  })

  test("returns true if they are the same FilterShuttleRunSelection", () => {
    const a: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter: /1.*/,
    }
    const b: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter: /1.*/,
    }

    expect(isMatchingShuttleRunSelection(a, b)).toBeTruthy()
  })

  test("returns false if they have different types", () => {
    const a: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      runId: "1",
    }
    const b: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter: /1.*/,
    }

    expect(isMatchingShuttleRunSelection(a, b)).toBeFalsy()
  })

  test("returns false if they have different run IDs", () => {
    const a: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      runId: "1",
    }
    const b: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      filter: /2.*/,
    }

    expect(isMatchingShuttleRunSelection(a, b)).toBeFalsy()
  })

  test("returns false if they have different filters", () => {
    const a: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter: /1.*/,
    }
    const b: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter: /2.*/,
    }

    expect(isMatchingShuttleRunSelection(a, b)).toBeFalsy()
  })
})

describe("matchesRunId", () => {
  test("compares the run IDs directly for a RunIdShuttleRunSelection", () => {
    const runIdShuttleRunSelection: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.RunId,
      runId: "999-0555",
    }

    expect(matchesRunId(runIdShuttleRunSelection, "999-0555")).toBeTruthy()
    expect(matchesRunId(runIdShuttleRunSelection, "999-0556")).toBeFalsy()
  })

  test("matches the run ID against the filter for a FilterShuttleRunSelection", () => {
    const filter: RegExp = /999-05.*/
    const filterShuttleRunSelection: ShuttleRunSelection = {
      type: ShuttleRunSelectionType.Filter,
      filter,
    }

    expect(matchesRunId(filterShuttleRunSelection, "999-0555")).toBeTruthy()
    expect(matchesRunId(filterShuttleRunSelection, "999-0655")).toBeFalsy()
  })
})
