import { describe, test, expect } from "@jest/globals"

import React, { PropsWithChildren } from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"

import { VehicleMarker } from "../../../../src/components/map/markers/vehicleMarker"

import { shuttleFactory, vehicleFactory } from "../../../factories/vehicle"
import { MapContainer } from "react-leaflet"

const TestMap = ({ children }: PropsWithChildren): React.JSX.Element => (
  <MapContainer
    center={[0, 0]}
    zoom={13}
    maxBounds={[
      [41.2, -72],
      [43, -69.8],
    ]}
  >
    {children}
  </MapContainer>
)

describe("VehicleMarker", () => {
  test("Includes icon and label", () => {
    const { container } = render(
      <VehicleMarker
        vehicle={vehicleFactory.build({
          runId: "101",
        })}
        isPrimary={true}
      />,
      {
        wrapper: TestMap,
      }
    )
    expect(container.querySelector(".c-vehicle-map__icon")).toBeInTheDocument()
    expect(screen.getByText("101")).toBeInTheDocument()
  })

  describe.each([
    {
      runId: "999-0501",
      specialClass: ".c-vehicle-marker--blue",
    },
    {
      runId: "999-0502",
      specialClass: ".c-vehicle-marker--green",
    },
    {
      runId: "999-0503",
      specialClass: ".c-vehicle-marker--orange",
    },
    {
      runId: "999-0504",
      specialClass: ".c-vehicle-marker--red",
    },
    {
      runId: "999-0505",
      specialClass: ".c-vehicle-marker--cr",
    },
    {
      runId: "999-0555",
      specialClass: null,
    },
    {
      runId: "101",
      specialClass: null,
    },
  ])(
    "when vehicle is shuttle with runId:`$runId`",
    ({ runId, specialClass }) => {
      test("should render with shuttle class", () => {
        const { container } = render(
          <VehicleMarker
            vehicle={shuttleFactory.build({
              runId,
            })}
            isPrimary={true}
          />,
          {
            wrapper: TestMap,
          }
        )

        expect(
          container.querySelector(".c-vehicle-marker--shuttle")
        ).toBeInTheDocument()
      })

      specialClass !== null &&
        test(`should render with class \`${specialClass}\``, () => {
          const { container } = render(
            <VehicleMarker
              vehicle={shuttleFactory.build({
                runId,
              })}
              isPrimary={true}
            />,
            {
              wrapper: TestMap,
            }
          )

          expect(container.querySelector(specialClass)).toBeInTheDocument()
        })
    }
  )
})
