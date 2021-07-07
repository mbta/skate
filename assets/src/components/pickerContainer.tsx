import React, { ReactElement, useContext } from "react"
import DrawerTab from "../components/drawerTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { togglePickerContainer } from "../state"

interface Props {
  children: ReactElement<HTMLElement>
  width?: Width
}

export enum Width {
  Narrow = 1,
  Wide,
}

const PickerContainer = ({
  children,
  width,
}: Props): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const toggleVisibility = () => dispatch(togglePickerContainer())

  const widthClassModifier =
    width === Width.Wide
      ? "m-picker-container--wide"
      : "m-picker-container--narrow"

  return (
    <div
      className={`m-picker-container ${widthClassModifier} ${
        state.pickerContainerIsVisible ? "visible" : "hidden"
      }`}
    >
      <DrawerTab
        isVisible={state.pickerContainerIsVisible}
        toggleVisibility={toggleVisibility}
      />
      {children}
    </div>
  )
}

export default PickerContainer
