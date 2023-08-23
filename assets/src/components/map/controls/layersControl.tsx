import React, { useContext, useState } from "react"
import { useMapEvents } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"
import { TileType } from "../../../tilesetUrls"
import { MapLayersIcon } from "../../../helpers/icon"
import { CustomControl } from "./customControl"
import { TileTypeContext } from "../../../contexts/tileTypeContext"

const LayersControlWithTileContext = (props: {
  setTileType: (tileType: TileType) => void
}): JSX.Element | null => {
  const tileType = useContext(TileTypeContext)
  return <LayersControl tileType={tileType} {...props} />
}

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
        <TileLayerControl tileType={tileType} setTileType={setTileType} />
      )}
    </CustomControl>
  )
}

const TileLayerControl = ({
  tileType,
  setTileType,
}: {
  tileType: TileType
  setTileType: (tileType: TileType) => void
}): JSX.Element => (
  <div className="c-layers-control__layers_list">
    <ul className="list-group">
      <li className="list-group-item">
        <input
          className="form-check-input"
          type="radio"
          name="tileType"
          value=""
          id="base"
          checked={tileType === "base"}
          onChange={() => setTileType("base")}
        />
        <label className="form-check-label" htmlFor="base">
          Map (default)
        </label>
      </li>
      <li className="list-group-item">
        <input
          className="form-check-input"
          type="radio"
          name="tileType"
          value=""
          id="satellite"
          checked={tileType === "satellite"}
          onChange={() => setTileType("satellite")}
        />
        <label className="form-check-label" htmlFor="satellite">
          Satellite
        </label>
      </li>
    </ul>
  </div>
)

LayersControl.WithTileContext = LayersControlWithTileContext
