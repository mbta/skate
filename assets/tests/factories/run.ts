import { Factory } from "fishery"
import { Run } from "../../src/minischedule"
import { RunId } from "../../src/realtime"

export const runIdFactory = Factory.define<RunId>(
  ({ sequence, transientParams: { prefix = "run-id" } }) =>
    `${prefix}-${sequence}`
)

export const RunFactory = Factory.define<Run>(({ associations: { id } }) => {
  return {
    id: id || runIdFactory.build(),
    activities: [],
  }
})
