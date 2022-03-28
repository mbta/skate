import React, { ReactElement, useContext } from "react"
import DrawerTab from "../components/drawerTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { togglePickerContainer } from "../state"

interface Props {
  children: ReactElement<HTMLElement>
}

const PickerContainer = ({ children }: Props): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const toggleVisibility = () => dispatch(togglePickerContainer())

  return (
    <>
      <div
        className={`m-picker-container ${
          state.pickerContainerIsVisible ? "visible" : "hidden"
        }`}
        data-testid="picker-container"
      >
        <DrawerTab
          isVisible={state.pickerContainerIsVisible}
          toggleVisibility={toggleVisibility}
        />
        {children}
      </div>
      {state.pickerContainerIsVisible ? (
        <div
          className="m-picker-container-overlay"
          onClick={toggleVisibility}
          data-testid="picker-container-overlay"
        />
      ) : null}
    </>
  )
}

export default PickerContainer
