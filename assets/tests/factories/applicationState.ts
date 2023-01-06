import { Factory } from "fishery"
import { initialState, State } from "../../src/state"

const stateFactory = Factory.define<State>(() => ({
  ...initialState,
}))

export default stateFactory
