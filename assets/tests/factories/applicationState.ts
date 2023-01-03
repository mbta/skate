import { Factory } from "fishery"
import { OpenView, State } from "../../src/state"
import { searchPageStateFactory } from "./searchPageState"
import { userSettingsFactory } from "./userSettings"

const stateFactory = Factory.define<State>(() => ({
  openView: OpenView.None,
  previousView: OpenView.None,
  pickerContainerIsVisible: true,
  openInputModal: null,

  mobileMenuIsOpen: false,

  notificationDrawerScrollPosition: 0,

  routeTabs: [],
  routeTabsPushInProgress: false,
  routeTabsToPush: null,
  routeTabsToPushNext: null,

  selectedNotification: undefined,
  selectedShuttleRouteIds: [],
  selectedShuttleRunIds: "all",
  selectedVehicleOrGhost: undefined,

  showGaragesFilter: false,

  showPastSwings: false,
  swingsViewScrollPosition: 0,

  searchPageState: searchPageStateFactory.build(),
  userSettings: userSettingsFactory.build(),
}))

export default stateFactory
