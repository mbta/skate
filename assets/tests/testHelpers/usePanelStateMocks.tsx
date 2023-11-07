import { jest } from "@jest/globals"
import { OpenView } from "../../src/state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../../src/hooks/usePanelState"

export function mockUsePanelState(
  values?: Partial<ReturnType<typeof usePanelStateFromStateDispatchContext>>
) {
  return jest.mocked(usePanelStateFromStateDispatchContext).mockReturnValue({
    currentView: {
      openView: OpenView.None,
      previousView: OpenView.None,
      selectedVehicleOrGhost: undefined,
    },
    setPath: jest.fn(),
    openVehiclePropertiesPanel: jest.fn(),
    openPreviousView: jest.fn(),
    closeView: jest.fn(),
    openNotificationDrawer: jest.fn(),
    openLateView: jest.fn(),
    openSwingsView: jest.fn(),

    ...(values || {}),
  })
}
