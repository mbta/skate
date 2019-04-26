import { mount, ReactWrapper } from "enzyme"
import React from "react"

type Callback = () => void

const TestHook = ({ callback }: { callback: Callback }) => {
  callback()
  return null
}

export const testHook = (callback: Callback): ReactWrapper => {
  return mount(<TestHook callback={callback} />)
}
