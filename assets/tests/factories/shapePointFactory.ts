import { Factory } from "fishery";
import { localGeoCoordinateFactory } from "./geoCoordinate";
import { ShapePoint } from "../../src/schedule";

/**
 * Wrapper around {@link localGeoCoordinateFactory} until {@link ShapePoint} is
 * updated to a global shared coordinate object
 */
export const shapePointFactory = Factory.define<ShapePoint>(() => {
  const { latitude, longitude } = localGeoCoordinateFactory.build();
  return { lat: latitude, lon: longitude };
});
