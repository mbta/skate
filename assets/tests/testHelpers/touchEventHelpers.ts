interface Position {
  x: number
  y: number
}

export const touchEvent = (position: Position): React.TouchEvent => ({
  preventDefault: () => void 0,
  // @ts-ignore
  touches: [touch(position)],
})

// @ts-ignore
const touch = (position: Position): React.Touch => ({
  screenX: position.x,
  screenY: position.y,
})
