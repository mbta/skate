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
import { Form, ListGroup } from "react-bootstrap"

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
  onChangeTileType,
  pullbackLayerEnabled,
  onTogglePullbackLayer,
}: LayersButtonProps) => (
  <div className="c-layers-control">
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

    <div className="c-layers-control__pill" hidden={!pullbackLayerEnabled}>
      {/* For now there's only one vehicle layer, in the future this might need to be an actual count */}
      1
    </div>

    <div hidden={!showLayersList}>
      <LayersPopoverMenu
        tileType={tileType}
        onChangeTileType={onChangeTileType}
        pullbackLayerEnabled={pullbackLayerEnabled}
        onTogglePullbackLayer={onTogglePullbackLayer}
      />
    </div>
  </div>
)

const LayersPopoverMenu = ({
  tileType,
  onChangeTileType: setTileType,
  pullbackLayerEnabled,
  onTogglePullbackLayer: togglePullbackLayerEnabled,
}: TileLayerOptionsProps & VehicleLayerOptionsProps) => {
  const tileLayerControlLabelId = "tile-layer-control-label-" + useId()
  const vehicleLayersControlLabelId = "vehicle-layers-control-label-" + useId()

  return (
    <div className="c-layers-control__content">
      <ListGroup as="ul">
        <ListGroup.Item as="li" aria-labelledby={tileLayerControlLabelId}>
          <TileLayerOptions
            tileType={tileType}
            onChangeTileType={setTileType}
            sectionLabelId={tileLayerControlLabelId}
          />
        </ListGroup.Item>
        {pullbackLayerEnabled !== undefined &&
          togglePullbackLayerEnabled !== undefined && (
            <ListGroup.Item
              as="li"
              aria-labelledby={vehicleLayersControlLabelId}
            >
              <VehicleLayerOptions
                sectionLabelId={vehicleLayersControlLabelId}
                pullbackLayerEnabled={pullbackLayerEnabled}
                onTogglePullbackLayer={togglePullbackLayerEnabled}
              />
            </ListGroup.Item>
          )}
      </ListGroup>
    </div>
  )
}

interface TileLayerOptionsProps {
  tileType: TileType
  onChangeTileType: (tileType: TileType) => void
}
const TileLayerOptions = ({
  tileType,
  onChangeTileType,
  sectionLabelId,
}: TileLayerOptionsProps & {
  sectionLabelId?: string
}) => (
  <div className="c-layers-control__tile_layer_control">
    <h2 id={sectionLabelId}>Base Map</h2>
    <Form.Check type="radio" id="base" className="position-relative">
      <Form.Check.Input
        type="radio"
        name="tileType"
        value=""
        checked={tileType === "base"}
        onChange={() => onChangeTileType("base")}
      />
      <Form.Check.Label className="stretched-link">
        Map (default)
      </Form.Check.Label>
    </Form.Check>
    <Form.Check type="radio" id="satellite" className="position-relative">
      <Form.Check.Input
        type="radio"
        name="tileType"
        value=""
        checked={tileType === "satellite"}
        onChange={() => onChangeTileType("satellite")}
      />
      <Form.Check.Label className="stretched-link">Satellite</Form.Check.Label>
    </Form.Check>
  </div>
)

interface VehicleLayerOptionsProps {
  pullbackLayerEnabled?: boolean
  onTogglePullbackLayer?: () => void
}
const VehicleLayerOptions = ({
  sectionLabelId,
  pullbackLayerEnabled,
  onTogglePullbackLayer,
}: {
  sectionLabelId?: string
} & VehicleLayerOptionsProps) => {
  const formCheckId = "pull-back-layer-switch-" + useId()

  return (
    <div className="c-layers-control__vehicle_layers_control">
      <h2 id={sectionLabelId}>Vehicles</h2>
      <Form.Check type="switch" id={formCheckId}>
        <Form.Check.Input
          role="switch"
          checked={pullbackLayerEnabled}
          onChange={onTogglePullbackLayer}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onTogglePullbackLayer?.()
            }
          }}
        />
        <Form.Check.Label>Show pull-backs</Form.Check.Label>
      </Form.Check>
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
