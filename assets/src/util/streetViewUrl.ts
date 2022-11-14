export const streetViewUrl = ({
  latitude,
  longitude,
  bearing,
}: {
  latitude: number
  longitude: number
  bearing?: number
}): string =>
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude}%2C${longitude}&heading=${
    bearing || 0
  }&pitch=0&fov=80`
