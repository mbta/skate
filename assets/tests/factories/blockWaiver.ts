import { Factory } from "fishery"
import { BlockWaiver } from "../../src/realtime"

export default Factory.define<BlockWaiver>(() => ({
  startTime: new Date(),
  endTime: new Date(),
  causeId: 123,
  causeDescription: "problem",
  remark: null,
}))
