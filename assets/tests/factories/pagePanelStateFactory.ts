import {
  PageViewState,
  ViewState,
  initialPageState,
  initialPageViewState,
} from "../../src/state/pagePanelState"
import { DeepPartial, Factory } from "fishery"
import vehicleFactory from "./vehicle"

class ViewFactory extends Factory<ViewState> {
  currentState(currentState: DeepPartial<PageViewState>) {
    return this.afterBuild((view) => {
      view.state[view.currentPath] = pageViewFactory
        .params(view.state[view.currentPath])
        .build(currentState)
    })
  }

  withVehicle(
    selectedVehicleOrGhost?: PageViewState["selectedVehicleOrGhost"]
  ) {
    return this.currentState({
      selectedVehicleOrGhost: selectedVehicleOrGhost ?? vehicleFactory.build(),
    })
  }
}

export const viewFactory = ViewFactory.define(() => initialPageViewState)
export const pageViewFactory = Factory.define<PageViewState>(
  () => initialPageState
)
