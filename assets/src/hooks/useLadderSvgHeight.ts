import { Dispatch, RefObject, SetStateAction, useLayoutEffect } from "react"

const useLadderSvgHeight = (
  ref: RefObject<SVGSVGElement>,
  x: number,
  y: number,
  width: number,
  height: number,
  setHeight: Dispatch<SetStateAction<number>>
) => {
  useLayoutEffect(() => {
    if (
      ref.current !== null &&
      // only if there is no viewBox attribute
      !ref.current.getAttribute("viewBox") &&
      // only if rendered
      ref.current.getBBox().width &&
      ref.current.getBBox().height
    ) {
      const routeLadder: HTMLElement = document.getElementsByClassName(
        "m-ladder"
      )[0] as HTMLElement
      const newHeight = routeLadder.offsetHeight
      if (newHeight !== height) {
        setHeight(newHeight)
        ref.current.setAttribute("width", `${width}`)
        ref.current.setAttribute("height", `${newHeight}`)
        // (0, 0) is in the center of the first timepoint
        ref.current.setAttribute("viewBox", [x, y, width, height].join(" "))
      }
    }
  }, [height])
}

export default useLadderSvgHeight
