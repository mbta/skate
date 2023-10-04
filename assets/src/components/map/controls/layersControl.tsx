import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useId,
  useState,
} from "react"
import { useMapEvents } from "react-leaflet"
import { joinClasses } from "../../../helpers/dom"
import { TileType } from "../../../tilesetUrls"
import { MapLayersIcon } from "../../../helpers/icon"
import { CustomControl } from "./customControl"
import { TileTypeContext } from "../../../contexts/tileTypeContext"

interface LayersButtonStateProps {
  showLayersList: boolean
  onChangeLayersListVisibility: (value: SetStateAction<boolean>) => void
}

export type LayersButtonProps = LayersButtonStateProps &
  VehicleLayerOptionsProps &
  TileLayerOptionsProps

export const LayersButton = ({
  showLayersList,
  onChangeLayersListVisibility,

  tileType,
  setTileType,
  pullbackLayerEnabled,
  togglePullbackLayerEnabled,
}: LayersButtonProps) => (
  <>
    <button
      title="Layers"
      className={joinClasses([
        "c-layers-control__button",
        showLayersList && "c-layers-control__button--selected",
        "leaflet-bar",
      ])}
      onClick={() =>
        onChangeLayersListVisibility((currentValue) => !currentValue)
      }
    >
      <MapLayersIcon />
    </button>

    {/* For now there's only one vehicle layer, in the future this might need to be an actual count */}
    {pullbackLayerEnabled ? (
      <div className="c-layers-control__pill">1</div>
    ) : null}

    {showLayersList && (
      <LayersPopoverMenu
        tileType={tileType}
        setTileType={setTileType}
        pullbackLayerEnabled={pullbackLayerEnabled}
        togglePullbackLayerEnabled={togglePullbackLayerEnabled}
      />
    )}
  </>
)

const LayersPopoverMenu = ({
  tileType,
  setTileType,
  pullbackLayerEnabled,
  togglePullbackLayerEnabled,
}: TileLayerOptionsProps & VehicleLayerOptionsProps) => {
  const tileLayerControlLabelId = "tile-layer-control-label-" + useId()
  const vehicleLayersControlLabelId = "vehicle-layers-control-label-" + useId()

  return (
    <div className="c-layers-control__content">
      <ul className="list-group">
        <li
          className="list-group-item"
          aria-labelledby={tileLayerControlLabelId}
        >
          <TileLayerOptions
            tileType={tileType}
            setTileType={setTileType}
            sectionLabelId={tileLayerControlLabelId}
          />
        </li>
        {pullbackLayerEnabled !== undefined &&
          togglePullbackLayerEnabled !== undefined && (
            <li
              className="list-group-item"
              aria-labelledby={vehicleLayersControlLabelId}
            >
              <VehicleLayerOptions
                sectionLabelId={vehicleLayersControlLabelId}
                pullbackLayerEnabled={pullbackLayerEnabled}
                togglePullbackLayerEnabled={togglePullbackLayerEnabled}
              />
            </li>
          )}
      </ul>
    </div>
  )
}

interface TileLayerOptionsProps {
  tileType: TileType
  setTileType: (tileType: TileType) => void
}
const TileLayerOptions = ({
  tileType,
  setTileType,
  sectionLabelId,
}: TileLayerOptionsProps & {
  sectionLabelId?: string
}) => (
  <div className="c-layers-control__tile_layer_control">
    <h2 id={sectionLabelId}>Base Map</h2>
    <div className="form-check position-relative">
      <input
        className="form-check-input"
        type="radio"
        name="tileType"
        value=""
        id="base"
        checked={tileType === "base"}
        onChange={() => setTileType("base")}
      />
      <label className="form-check-label stretched-link" htmlFor="base">
        Map (default)
      </label>
    </div>
    <div className="form-check position-relative">
      <input
        className="form-check-input"
        type="radio"
        name="tileType"
        value=""
        id="satellite"
        checked={tileType === "satellite"}
        onChange={() => setTileType("satellite")}
      />
      <label className="form-check-label stretched-link" htmlFor="satellite">
        Satellite
      </label>
    </div>
  </div>
)

interface VehicleLayerOptionsProps {
  pullbackLayerEnabled?: boolean
  togglePullbackLayerEnabled?: () => void
}
const VehicleLayerOptions = ({
  sectionLabelId,
  pullbackLayerEnabled,
  togglePullbackLayerEnabled,
}: {
  sectionLabelId?: string
} & VehicleLayerOptionsProps) => {
  const inputId = "pull-back-layer-switch-" + useId()

  return (
    <div className="c-layers-control__vehicle_layers_control">
      <h2 id={sectionLabelId}>Vehicles</h2>
      <div className="form-check form-switch position-relative">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={inputId}
          checked={pullbackLayerEnabled}
          onChange={togglePullbackLayerEnabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && togglePullbackLayerEnabled) {
              togglePullbackLayerEnabled()
            }
          }}
        />
        <label className="form-check-label stretched-link" htmlFor={inputId}>
          Show pull-backs
        </label>
      </div>
    </div>
  )
}

export const LayersControl = (props: LayersButtonProps) => {
  useMapEvents({
    click: () => {
      props.onChangeLayersListVisibility(false)
    },
  })

  return (
    <CustomControl
      className="c-layers-control"
      position="topright"
      insertAfterSelector={".leaflet-control-zoom"}
    >
      <LayersButton {...props} />
    </CustomControl>
  )
}

const LayersControlWithTileContext = (
  props: Omit<LayersButtonProps, "tileType">
) => {
  const tileType = useContext(TileTypeContext)
  return <LayersControl tileType={tileType} {...props} />
}

LayersControl.WithTileContext = LayersControlWithTileContext

type LayersControlStateProps = {
  open?: boolean
  children: (
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => JSX.Element
}

export const LayersControlState = ({
  open: startOpen = false,
  children,
}: LayersControlStateProps) => {
  const [open, setOpen] = useState(startOpen)
  return children(open, setOpen)
}
