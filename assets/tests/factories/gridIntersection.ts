import { Factory } from "fishery"

type Intersection = string

export const gridIntersectionFactory = Factory.define<Intersection>(
  ({ sequence }) => [`${sequence * 10}N`, "0W"].join(" @ ")
)
