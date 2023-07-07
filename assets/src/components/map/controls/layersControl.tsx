import React, { useState } from "react"
import { TileLayer, useMapEvents } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"
import { TileType, tilesetUrlForType } from "../../../tilesetUrls"
import { MapLayersIcon } from "../../../helpers/icon"
import { CustomControl } from "./customControl"

export const LayersControl = ({
  tileType,
  setTileType,
}: {
  tileType: TileType
  setTileType: (tileType: TileType) => void
}): JSX.Element | null => {
  const [showLayersList, setShowLayersList] = useState(false)

  useMapEvents({
    click: () => {
      setShowLayersList(false)
    },
  })

  return (
    <>
      <CustomControl
        className="c-layers-control"
        position="topright"
        insertAfterSelector={".leaflet-control-zoom"}
      >
        <button
          title="Layers"
          className={joinClasses([
            "c-layers-control__button",
            showLayersList && "c-layers-control__button--selected",
            "leaflet-bar",
          ])}
          onClick={() => setShowLayersList((currentVal) => !currentVal)}
        >
          <MapLayersIcon />
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
                    onChange={() => setTileType("base")}
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
                    onChange={() => setTileType("satellite")}
                  />
                  Satellite
                </label>
              </li>
            </ul>
          </div>
        )}
      </CustomControl>
      <TileLayer
        url={`${tilesetUrlForType(tileType)}`}
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
    </>
  )
}
