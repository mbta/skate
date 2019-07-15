interface Position {
  x: number
  y: number
}

export const touchEvent = (position: Position): React.TouchEvent => ({
  // inherited key sorting bug in tslint: https://github.com/palantir/tslint/issues/3586
  // tslint:disable-next-line:object-literal-sort-keys
  preventDefault: () => void 0,
  // @ts-ignore
  touches: [touch(position)],
})

// @ts-ignore
const touch = (position: Position): React.Touch => ({
  screenX: position.x,
  screenY: position.y,
})
