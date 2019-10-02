import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { deselectVehicle } from "../../state"

const CloseButton = () => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hidePanel = () => dispatch(deselectVehicle())

  return (
    <button className="m-properties-panel__close-button" onClick={hidePanel}>
      Close
    </button>
  )
}

export default CloseButton
