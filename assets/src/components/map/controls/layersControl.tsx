import React, { useContext, useId, useState } from "react"
import { useMapEvents } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"
import { TileType } from "../../../tilesetUrls"
import { MapLayersIcon } from "../../../helpers/icon"
import { CustomControl } from "./customControl"
import { TileTypeContext } from "../../../contexts/tileTypeContext"
import inTestGroup, { TestGroups } from "../../../userInTestGroup"

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
        <LayersControlContent tileType={tileType} setTileType={setTileType} />
      )}
    </CustomControl>
  )
}

const LayersControlContent = ({
  tileType,
  setTileType,
}: {
  tileType: TileType
  setTileType: (tileType: TileType) => void
}): JSX.Element => {
  const tileLayerControlLabelId = "tile-layer-control-label-" + useId()
  const vehicleLayersControlLabelId = "vehicle-layers-control-label-" + useId()

  return (
    <div className="c-layers-control__content">
      <ul className="list-group">
        <li
          className="list-group-item"
          aria-labelledby={tileLayerControlLabelId}
        >
          <TileLayerControl
            tileType={tileType}
            setTileType={setTileType}
            sectionLabelId={tileLayerControlLabelId}
          />
        </li>
        {inTestGroup(TestGroups.PullBackMapLayer) && (
          <li
            className="list-group-item"
            aria-labelledby={vehicleLayersControlLabelId}
          >
            <VehicleLayersControl
              sectionLabelId={vehicleLayersControlLabelId}
            />
          </li>
        )}
      </ul>
    </div>
  )
}

const TileLayerControl = ({
  tileType,
  setTileType,
  sectionLabelId,
}: {
  tileType: TileType
  setTileType: (tileType: TileType) => void
  sectionLabelId?: string
}): JSX.Element => (
  <div className="c-layers-control__tile_layer_control">
    <h2 id={sectionLabelId}>Base Map</h2>
    <div className="form-check">
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
    </div>
    <div className="form-check">
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
    </div>
  </div>
)

const VehicleLayersControl = ({
  sectionLabelId,
}: {
  sectionLabelId?: string
}): JSX.Element => {
  const inputId = "pull-back-layer-switch-" + useId()

  return (
    <div className="c-layers-control__vehicle_layers_control">
      <h2 id={sectionLabelId}>Vehicles</h2>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={inputId}
        />
        <label className="form-check-label" htmlFor={inputId}>
          Show pull-backs
        </label>
      </div>
    </div>
  )
}

LayersControl.WithTileContext = LayersControlWithTileContext
