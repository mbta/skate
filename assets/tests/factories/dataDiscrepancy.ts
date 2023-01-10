import { Factory } from "fishery"
import { DataDiscrepancy, DataDiscrepancySource } from "../../src/realtime"

interface DataDiscrepancySourceFactoryTransientParams {
  dataSource?: string
  type?: string
}

class DataDiscrepancySourceFactory extends Factory<
  DataDiscrepancySource,
  DataDiscrepancySourceFactoryTransientParams
> {
  dataSource(dataSource: string) {
    return this.transient({ dataSource })
  }

  type(type: string) {
    return this.transient({ type })
  }

  withRouteId() {
    return this.type("route-id")
  }
}

export const dataDiscrepancySourceFactory = DataDiscrepancySourceFactory.define(
  ({ sequence, transientParams: { dataSource, type } }) => ({
    id: `${dataSource ?? "data-source"}`,
    value: `${dataSource ?? "data-source"}-${type ?? "trip-id"}-${sequence}`,
  })
)

export const swiftlyDataDiscrepancySourceFactory =
  dataDiscrepancySourceFactory.dataSource("swiftly")
export const buslocDataDiscrepancySourceFactory =
  dataDiscrepancySourceFactory.dataSource("busloc")

export const dataDiscrepancyFactory = Factory.define<DataDiscrepancy>(
  ({ sequence, transientParams: { dataType } }) => ({
    attribute: `${dataType ?? "trip-id"}-${sequence}`,
    sources: [
      swiftlyDataDiscrepancySourceFactory.build(),
      buslocDataDiscrepancySourceFactory.build(),
    ],
  })
)
