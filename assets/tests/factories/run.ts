import { Factory } from "fishery"
import { Run } from "../../src/minischedule"

export const RunFactory = Factory.define<Run>(({ sequence }) => {
  return {
    id: `run-id-${sequence}`,
    activities: [],
  }
})
