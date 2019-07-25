const MIN_X = 30 // Min x swipe for horizontal swipe
const MAX_X = 30 // Max x difference for vertical swipe
const MIN_Y = 50 // Min y swipe for vertical swipe
const MAX_Y = 60 // Max y difference for horizontal swipe

type Callback = (
  swipeDirection: SwipeDirection,
  srcElement: HTMLElement | null
) => void

type CleanupFunction = () => void

interface Position {
  x: number
  y: number
}

export type SwipeDirection = "Down" | "Left" | "Right" | "Up"

const detectSwipe = (
  elementId: string,
  callback: Callback
): CleanupFunction => {
  let startingPosition: Position
  let endingPosition: Position

  const handleTouchStart = (event: TouchEvent) => {
    const position = firstTouchPosition(event)
    startingPosition = position
    endingPosition = position
  }

  const handleTouchMove = (event: TouchEvent) => {
    endingPosition = firstTouchPosition(event)
  }

  const handleTouchEnd = (event: TouchEvent) => {
    const movement = diff(endingPosition, startingPosition)
    const swipeDirection = directionOfMovement(movement)
    if (swipeDirection) {
      callback(swipeDirection, event.srcElement as HTMLElement)
    }
  }

  const el = document.getElementById(elementId)
  if (!el) {
    // Bail if we can't find an element
    return () => void 0
  }

  el.addEventListener("touchstart", handleTouchStart)
  el.addEventListener("touchmove", handleTouchMove)
  el.addEventListener("touchend", handleTouchEnd)

  return () => {
    el.removeEventListener("touchstart", handleTouchStart)
    el.removeEventListener("touchmove", handleTouchMove)
    el.removeEventListener("touchend", handleTouchEnd)
  }
}

const firstTouchPosition = (event: TouchEvent): Position => {
  const { screenX, screenY } = event.touches[0]
  return { x: screenX, y: screenY }
}

const diff = (end: Position, start: Position): Position => ({
  x: end.x - start.x,
  y: end.y - start.y,
})

const directionOfMovement = (
  movement: Position
): SwipeDirection | undefined => {
  if (Math.abs(movement.x) > MIN_X && Math.abs(movement.y) < MAX_Y) {
    // Horizontal movement
    return movement.x > 0 ? "Right" : "Left"
  } else if (Math.abs(movement.y) > MIN_Y && Math.abs(movement.x) < MAX_X) {
    // Vertical movement
    return movement.y > 0 ? "Down" : "Up"
  } else {
    return undefined
  }
}

export default detectSwipe
