import { useMemo } from "react"

import { DivIcon, DivIconOptions as LeafletDivIconOptions } from "leaflet"

// Prevent user from setting parameters we intend to provide
export type DivIconOptions = Omit<LeafletDivIconOptions, "html">

// Prevent useEffect from triggering by providing stable default reference
const defaultOptions = {}

// DefinitelyTyped definitions _seem_ to allow us to use a "real" class instead of `.extend`?
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/3923
// https://leafletjs.com/examples/extending/extending-1-classes.html
/**
 * A Leaflet {@linkcode DivIcon} which uses a provided {@linkcode HTMLElement}
 * as the marker element returned to leaflet when the associated Marker is added
 * to the map.
 *
 * The provided {@linkcode HTMLElement} is a stable element that is created
 * before the {@linkcode DivIcon} is added to a Map via a Marker. This is
 * required so that the {@linkcode HTMLElement} reference can be created before
 * the Marker and Icon are added to the `Map`
 */
class DivIconReactPortal extends DivIcon {
  /**
   * Stable element reference for React Portals.
   */
  element: HTMLElement

  constructor(element: HTMLElement, options?: DivIconOptions) {
    super(options)
    this.element = element
  }

  /**
   * Overridden function which returns our stable {@linkcode HTMLElement}
   * reference and configures the {@linkcode DivIconReactPortal.element}
   * attributes according to Leaflet.
   *
   * ---
   *
   * {@linkcode _oldIcon} is the {@linkcode HTMLElement} reference that a
   * Leaflet Marker stores between `onAdd` and `onRemove` calls.
   * Because we _always_ want Leaflet to use our stable element reference,
   * {@linkcode DivIconReactPortal.element} is always returned.
   */
  createIcon(_oldIcon?: HTMLElement): HTMLElement {
    this.setElementIconStyles()
    return this.element
  }

  // The whole reason we have to recreate the `DivIcon` entirely is because we
  // need to call `_setIconStyles` on the element, when the `DivIcon` `options`
  // change. Pulling this out into it's own known function may allow us to
  // avoid recreating the DivIcon entirely in the future, and instead update it
  // when the `options` change.
  setElementIconStyles() {
    // We KNOW that this function exists, but the `DefinitelyTyped` definitions
    // do not include it.
    if ("_setIconStyles" in this && typeof this._setIconStyles === "function") {
      this._setIconStyles(this.element, "icon")
    }
  }
}

/**
 * Hook to create a `divIcon` compatible with {@link ReactDOM.createPortal}, by
 * creating a stable {@link HTMLDivElement container} for React to use for
 * rendering.
 *
 * ---
 *
 * Because Leaflet by default doesn't support updating a `divIcon` in place,
 * this replaces the `divIcon` every time that the parameter {@link options}
 * is updated, to ensure that `divIcon` is up to date for react-leaflet
 * `Marker`.
 */
export function useReactDivIcon(options?: DivIconOptions) {
  const opts = options || defaultOptions
  // Persistent element for react portal to use between `divIcon` recreations
  const iconContainer = useMemo(createPortalElement, [])
  // Leaflet by default doesn't support updating a `divIcon` in place.
  // To ensure that the `divIcon` updates when `opts` change
  // regenerate the `divIcon` with the portal element and provided `opts`
  const divIcon = useMemo(
    () => new DivIconReactPortal(iconContainer, opts),
    [iconContainer, opts]
  )

  return {
    divIcon,
    iconContainer,
  }
}

// Extend this function or add more parameters to `useReactDivIcon` to override
// portal element creation
const createPortalElement = () => document.createElement("div")
