import { GeographicCoordinateBearing } from "../components/streetViewButton";

export const streetViewUrl = ({
  latitude,
  longitude,
  bearing,
}: GeographicCoordinateBearing): string =>
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude}%2C${longitude}${
    bearing ? `&heading=${bearing}` : ""
  }&pitch=0&fov=80`
