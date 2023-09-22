import { Control, ControlOptions, DomUtil } from "leaflet"
import { createControlComponent } from "@react-leaflet/core"

interface RecenterControlProps extends ControlOptions {
  recenter: () => void
}
class LeafletRecenterControl extends Control {
  private recenter: () => void
  constructor(props: ControlOptions, recenter: () => void) {
    super(props)
    this.recenter = recenter
  }

  onAdd() {
    const controlContainer = DomUtil.create(
      "div",
      "leaflet-control leaflet-bar c-vehicle-map__recenter-button"
    )
    controlContainer.onclick = (e) => {
      e.stopPropagation()
      e.preventDefault()

      window.FS?.event("Recenter control clicked")

      this.recenter()
    }
    controlContainer.innerHTML = `
		<a
		  href="#"
		  title="Recenter Map"
		  role="button"
		  aria-label="Recenter Map"
		    >
		    <svg
			height="26"
			viewBox="-5 -5 32 32"
			width="26"
			xmlns="http://www.w3.org/2000/svg"
			>
			<path
			     d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
			     transform="rotate(60, 12, 12)"
			/>
		    </svg>
		</a>`
    return controlContainer
  }
}

export const RecenterControl = createControlComponent(
  ({ position: position, recenter: recenterFn }: RecenterControlProps) =>
    new LeafletRecenterControl({ position: position }, recenterFn)
)
