interface VehicleMarkerProps extends PropsWithChildren {
  vehicle: Vehicle
  isPrimary: boolean
  isSelected?: boolean
  onSelect?: (vehicle: Vehicle) => void
  shouldShowPopup?: boolean
  onShouldShowPopupChange?: (newValue: boolean) => void
}

export const VehicleMarker = ({
  children,
  vehicle,
  isPrimary,
  onSelect,
  isSelected = false,
  shouldShowPopup = false,
  onShouldShowPopupChange = () => {},
}: VehicleMarkerProps) => {
  const [{ userSettings }] = useContext(StateDispatchContext)
  const markerRef = useRef<Leaflet.Marker<any>>(null)

  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

  useEffect(() => {
    if (shouldShowPopup && !isPopupVisible) {
      markerRef.current?.openPopup()
    }

    if (!shouldShowPopup && isPopupVisible) {
      markerRef.current?.closePopup()
    }
  }, [shouldShowPopup, isPopupVisible])

  const eventHandlers = {
    click: () => {
      onSelect && onSelect(vehicle)
      onShouldShowPopupChange(false)
    },
    contextmenu: () => {
      onShouldShowPopupChange(true)
    },
    popupopen: () => {
      setIsPopupVisible(true)
    },
    popupclose: () => {
      setIsPopupVisible(false)
      onShouldShowPopupChange(false)
    },
  }
  const position: LatLngExpression = [vehicle.latitude, vehicle.longitude]
  const labelBackgroundHeight = isPrimary ? 16 : 12
  const labelBackgroundWidth =
    vehicleLabel(vehicle, userSettings).length <= 4
      ? isPrimary
        ? 40
        : 30
      : isPrimary
      ? 62
      : 40

  // https://leafletjs.com/reference.html#marker-zindexoffset
  // > By default, marker images zIndex is set automatically based on its latitude
  // > [...] if you want to put the marker on top of all others,
  // > [specify] a high value like 1000 [...]
  const zIndexOffset = isSelected ? 1000 : 0

  return (
    <>
      <ReactMarker
        position={position}
        eventHandlers={eventHandlers}
        zIndexOffset={zIndexOffset}
        ref={markerRef}
        divIconSettings={{
          iconAnchor: [0, 0],
          className: "c-vehicle-map__icon",
        }}
        icon={
          <svg
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className={joinClasses([
                ...statusClasses(
                  drawnStatus(vehicle),
                  userSettings.vehicleAdherenceColors
                ),
                isSelected ? "selected" : null,
              ])}
              d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
              transform={
                `scale(${isPrimary ? 1.0 : 0.8}) ` +
                `rotate(${vehicle.bearing || 0}) ` +
                `translate(-12, -12)`
              }
            />
          </svg>
        }
      >
        {children}
      </ReactMarker>

      <ReactMarker
        position={position}
        divIconSettings={{
          iconAnchor: [labelBackgroundWidth / 2, isPrimary ? -16 : -10],
          className: joinClasses([
            "c-vehicle-map__label",
            isPrimary ? "primary" : "secondary",
            isSelected && "selected",
          ]),
        }}
        icon={
          <svg
            viewBox={`0 0 ${labelBackgroundWidth} ${labelBackgroundHeight}`}
            width={labelBackgroundWidth}
            height={labelBackgroundHeight}
          >
            <rect
              className="c-vehicle-icon__label-background"
              width="100%"
              height="100%"
              rx="5.5px"
              ry="5.5px"
            />
            <text
              className="c-vehicle-icon__label"
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {vehicleLabel(vehicle, userSettings)}
            </text>
          </svg>
        }
        eventHandlers={eventHandlers}
        zIndexOffset={zIndexOffset}
      />
    </>
  )
}
