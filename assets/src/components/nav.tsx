import React from "react"
import { OpenView } from "../state"
import TabBar from "./tabBar"

interface Props {
  pickerContainerIsVisible: boolean
  openView: OpenView
}

export const Nav: React.FC<Props> = ({
  children,
  pickerContainerIsVisible,
  openView,
}) => {
  return (
    <>
      <TabBar
        pickerContainerIsVisible={pickerContainerIsVisible}
        openView={openView}
      />
      {children}
    </>
  )
}
