import { jest } from "@jest/globals"
import { usePanelStateFromStateDispatchContext } from "../../src/hooks/usePanelState"
import { pageViewFactory } from "../factories/pagePanelStateFactory"

export function mockUsePanelState(
  values?: Partial<ReturnType<typeof usePanelStateFromStateDispatchContext>>
) {
  return jest.mocked(usePanelStateFromStateDispatchContext).mockReturnValue({
    currentView: pageViewFactory.build(),
    setPath: jest.fn(),
    openVehiclePropertiesPanel: jest.fn(),
    openPreviousView: jest.fn(),
    closeView: jest.fn(),
    openNotificationDrawer: jest.fn(),
    openLateView: jest.fn(),
    openSwingsView: jest.fn(),
    setTabMode: jest.fn(),

    ...(values || {}),
  })
}
