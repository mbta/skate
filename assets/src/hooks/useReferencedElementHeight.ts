import { RefObject, useLayoutEffect, useRef, useState } from "react"

const useReferencedElementHeight = (): {
  height: number
  elementRef: RefObject<HTMLDivElement>
} => {
  const [height, setHeight] = useState<number>(0)
  const elementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)

  const newHeight = elementRef.current ? elementRef.current.offsetHeight : 0

  useLayoutEffect(() => {
    setHeight(newHeight)
  }, [newHeight, height])

  return { height, elementRef }
}

export default useReferencedElementHeight
