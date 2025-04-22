import { Factory } from "fishery"
import { Timepoint } from "../../src/schedule"

export const TimepointFactory = Factory.define<Timepoint>(({ sequence }) => ({
  id: `timepoint-${sequence.toString()}`,
  name: `Timepoint ${sequence}`,
}))
