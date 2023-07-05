import Leaflet from "leaflet"
import React, { useContext, useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { TileLayer, useMap, useMapEvents } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"
import { tilesetUrlForType } from "../../../tilesetUrls"
import { StateDispatchContext } from "../../../contexts/stateDispatchContext"
import { setTileType } from "../../../state/mapLayersState"

export const LayersControl = (): JSX.Element | null => {
  const [{ mapLayers }, dispatch] = useContext(StateDispatchContext)
  const tileType = mapLayers.tileType
  const map = useMap()
  const portalParent = map
    .getContainer()
    // TODO: handle two maps?
    .querySelector(".leaflet-control-container .leaflet-top.leaflet-right")
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  const [showLayersList, setShowLayersList] = useState(false)

  useEffect(() => {
    if (!portalParent || !portalElement) {
      setPortalElement(document.createElement("div"))
    }

    if (portalParent && portalElement) {
      portalElement.className = joinClasses(["c-map__layer-control"])
      portalParent.append(portalElement)
      Leaflet.DomEvent.disableClickPropagation(portalElement)
    }

    return () => portalElement?.remove()
  }, [portalElement, portalParent])

  useMapEvents({
    click: () => {
      setShowLayersList(false)
    },
  })

  const control = (
    <div className="c-layers-control leaflet-control leaflet-bar">
      <button
        className=" c-layers-control__button leaflet-bar"
        onClick={() => setShowLayersList((currentVal) => !currentVal)}
      >
        Show layers
      </button>
      {showLayersList && (
        <div className="c-layers-control__layers_list leaflet-bar">
          <ul className="list-group">
            <li className="list-group-item">
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tileType"
                  value=""
                  id="base"
                  checked={tileType === "base"}
                  onChange={() => dispatch(setTileType("base"))}
                />
                Map (default)
              </label>
            </li>
            <li className="list-group-item">
              <label className="form-check-label">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tileType"
                  value=""
                  id="satellite"
                  checked={tileType === "satellite"}
                  onChange={() => dispatch(setTileType("satellite"))}
                />
                Satellite
              </label>
            </li>
          </ul>
        </div>
      )}
    </div>
  )

  return portalElement ? (
    <>
      {ReactDOM.createPortal(control, portalElement)}
      <TileLayer
        url={`${tilesetUrlForType(tileType)}`}
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
    </>
  ) : null
}
